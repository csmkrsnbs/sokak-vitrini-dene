import { and, count, eq, gte, or } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { previewRequests } from "@/lib/db/schema";

const SAFETY_VIOLATION_LIMIT = 3;
const SAFETY_RESTRICTION_HOURS = 24;

const BLOCKED_NOTE_ROOTS = [
  "çıplak",
  "nude",
  "naked",
  "porn",
  "porno",
  "seks",
  "sexual",
  "erotik",
  "genital",
  "çocuk",
  "reşit",
  "minor",
  "teen",
  "şiddet",
  "kanlı",
  "işkence",
  "öldür",
  "silah",
  "tabanca",
  "tüfek",
  "bomba",
  "weapon",
  "rifle",
  "kill",
  "blood",
  "nefret",
  "terör",
  "teror",
  "nazi",
  "extremist",
  "siyasi",
  "politik",
  "seçim",
  "secim",
  "parti",
  "propaganda",
  "miting",
  "protest",
  "cumhurbaşkan",
  "başbakan",
  "milletvekil",
  "president",
  "election",
  "politician",
  "political",
] as const;

const FORBIDDEN_APPEARANCE_CHANGE_PATTERNS = [
  /(?:ten|cilt|skin|complexion).{0,32}(?:değiş|aç|koyu|beyaz|bronz|change|lighten|darken|whiten|tan)/iu,
  /(?:değiş|aç|koyu|beyaz|bronz|change|lighten|darken|whiten|tan).{0,32}(?:ten|cilt|skin|complexion)/iu,
  /(?:yüz|surat|face|kimlik|identity|etnik|ethnic).{0,32}(?:değiş|başka|change|swap|replace)/iu,
  /(?:saç|hair).{0,32}(?:değiş|boya|uzat|kısalt|change|dye|longer|shorter)/iu,
  /(?:vücut|beden|bel|kalça|göğüs|body|waist|hip|chest).{0,32}(?:incelt|zayıf|büyüt|küçült|değiş|slim|reshape|enlarge|reduce|change)/iu,
  /(?:makyaj|makeup|beauty filter|güzelleştir|retouch)/iu,
] as const;

export class UnsafePlacementNoteError extends Error {
  constructor() {
    super(
      "Yerleşim notu yalnızca ürünün konumu, yönü ve ölçüsüyle ilgili olmalıdır.",
    );
    this.name = "UnsafePlacementNoteError";
  }
}

export class ContentSafetyRestrictedError extends Error {
  constructor() {
    super(
      "İçerik kurallarına aykırı tekrar eden denemeler nedeniyle bu tarayıcı, bağlantı veya kupon için görsel üretimi 24 saat durduruldu.",
    );
    this.name = "ContentSafetyRestrictedError";
  }
}

export function validatePlacementNote(note: string | null) {
  if (!note) return;

  const words = note
    .normalize("NFKC")
    .toLocaleLowerCase("tr-TR")
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);

  const normalizedNote = note.normalize("NFKC").toLocaleLowerCase("tr-TR");
  if (
    words.some((word) =>
      BLOCKED_NOTE_ROOTS.some((blockedRoot) => word.startsWith(blockedRoot)),
    ) ||
    FORBIDDEN_APPEARANCE_CHANGE_PATTERNS.some((pattern) => pattern.test(normalizedNote))
  ) {
    throw new UnsafePlacementNoteError();
  }
}

export async function assertContentSafetyAllowed({
  sessionId,
  clientKey,
  couponId,
}: {
  sessionId: string;
  clientKey: string;
  couponId: string | null;
}) {
  const db = getDb();
  const cutoff = new Date(
    Date.now() - SAFETY_RESTRICTION_HOURS * 60 * 60 * 1000,
  );
  const identityCondition = couponId
    ? or(
        eq(previewRequests.sessionId, sessionId),
        eq(previewRequests.clientKey, clientKey),
        eq(previewRequests.couponId, couponId),
      )
    : or(
        eq(previewRequests.sessionId, sessionId),
        eq(previewRequests.clientKey, clientKey),
      );

  const [result] = await db
    .select({ total: count() })
    .from(previewRequests)
    .where(
      and(
        identityCondition,
        eq(previewRequests.errorCode, "UNSAFE_CONTENT"),
        gte(previewRequests.createdAt, cutoff),
      ),
    );

  if ((result?.total ?? 0) >= SAFETY_VIOLATION_LIMIT) {
    throw new ContentSafetyRestrictedError();
  }
}

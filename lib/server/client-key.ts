import { createHash } from "node:crypto";
import { isIP } from "node:net";

import { NextRequest } from "next/server";

function normalizeIp(value: string | null) {
  const candidate = value?.split(",")[0]?.trim();
  if (!candidate) return null;

  const withoutIpv4Prefix = candidate.startsWith("::ffff:")
    ? candidate.slice("::ffff:".length)
    : candidate;

  return isIP(withoutIpv4Prefix) ? withoutIpv4Prefix : null;
}

export function getClientIp(request: NextRequest) {
  return (
    normalizeIp(request.headers.get("x-vercel-forwarded-for")) ||
    normalizeIp(request.headers.get("x-forwarded-for")) ||
    normalizeIp(request.headers.get("x-real-ip"))
  );
}

export function getClientKey(request: NextRequest, sessionId: string) {
  const networkIdentity = getClientIp(request) || sessionId;
  const salt =
    process.env.RATE_LIMIT_SALT?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "sokak-vitrini-local-development";

  return createHash("sha256")
    .update(`${salt}:${networkIdentity}`)
    .digest("hex");
}

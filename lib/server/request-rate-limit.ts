import {sql} from "drizzle-orm";
import type {NextRequest} from "next/server";
import {getDb} from "@/lib/db";
import {getClientKey} from "@/lib/server/client-key";

export async function allowRequest(request: NextRequest, scope: "admin" | "coupon", limit: number) {
  const key = scope + ":" + getClientKey(request, "rate-limit-no-ip");
  const result = await getDb().execute(sql`
    INSERT INTO request_rate_limits ("key", hits, expires_at)
    VALUES (${key}, 1, NOW() + INTERVAL '15 minutes')
    ON CONFLICT ("key") DO UPDATE SET
      hits = CASE WHEN request_rate_limits.expires_at <= NOW() THEN 1 ELSE LEAST(request_rate_limits.hits + 1, ${limit + 1}) END,
      expires_at = CASE WHEN request_rate_limits.expires_at <= NOW() THEN NOW() + INTERVAL '15 minutes' ELSE request_rate_limits.expires_at END
    RETURNING hits
  `);
  const rows = (result as unknown as {rows?: {hits: number}[]}).rows;
  if (!rows?.length) throw new Error("Rate limit check unavailable");
  return Number(rows[0].hits) <= limit;
}

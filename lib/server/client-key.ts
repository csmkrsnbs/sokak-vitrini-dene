import { createHash } from "node:crypto";

import { NextRequest } from "next/server";

export function getClientKey(request: NextRequest, sessionId: string) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const networkIdentity = forwardedFor || realIp || sessionId;
  const salt =
    process.env.RATE_LIMIT_SALT?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "sokak-vitrini-local-development";

  return createHash("sha256")
    .update(`${salt}:${networkIdentity}`)
    .digest("hex");
}

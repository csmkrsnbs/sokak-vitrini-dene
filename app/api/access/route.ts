import { NextRequest, NextResponse } from "next/server";

import { MissingDatabaseConfigurationError } from "@/lib/db";
import { getAccessState } from "@/lib/server/access";
import { attachSessionCookie, getSession, noStoreHeaders } from "@/lib/server/api";
import { getClientKey } from "@/lib/server/client-key";
import { MissingCouponConfigurationError } from "@/lib/server/coupons";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = getSession(request);

  try {
    const access = await getAccessState({
      request,
      sessionId: session.id,
      clientKey: getClientKey(request, session.id),
    });
    const response = NextResponse.json({ access }, { headers: noStoreHeaders() });
    return attachSessionCookie(response, session);
  } catch (error) {
    if (
      error instanceof MissingDatabaseConfigurationError ||
      error instanceof MissingCouponConfigurationError
    ) {
      return NextResponse.json(
        { error: { code: "ACCESS_NOT_CONFIGURED", message: "Kullanım hakları henüz yapılandırılmadı." } },
        { status: 503, headers: noStoreHeaders() },
      );
    }
    console.error("Access state failed", error);
    return NextResponse.json(
      { error: { code: "ACCESS_FAILED", message: "Kullanım hakları alınamadı." } },
      { status: 500, headers: noStoreHeaders() },
    );
  }
}

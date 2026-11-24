import { allowRequest } from "@/lib/server/request-rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  apiError,
  isSameOrigin,
  noStoreHeaders,
} from "@/lib/server/api";
import {
  attachAdminCookie,
  clearAdminCookie,
  isAdminAuthenticated,
  MissingAdminConfigurationError,
  verifyAdminAccessKey,
} from "@/lib/server/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({ accessKey: z.string().min(16).max(256) });

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      { authenticated: isAdminAuthenticated(request) },
      { headers: noStoreHeaders() },
    );
  } catch (error) {
    if (error instanceof MissingAdminConfigurationError) {
      return apiError("ADMIN_NOT_CONFIGURED", "Yönetim erişimi henüz yapılandırılmadı.", 503);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return apiError("INVALID_ORIGIN", "İstek doğrulanamadı.", 403, noStoreHeaders());
  }

  try {
    if (!(await allowRequest(request, "admin", 5))) {
      return apiError("RATE_LIMITED", "Çok fazla deneme yapıldı. 15 dakika sonra tekrar deneyin.", 429, {...noStoreHeaders(), "Retry-After":"900"});
    }
    const parsed = loginSchema.safeParse(await request.json());
    if (!parsed.success || !verifyAdminAccessKey(parsed.data.accessKey)) {
      return apiError("INVALID_ADMIN_KEY", "Yönetim anahtarı geçersiz.", 401, noStoreHeaders());
    }

    return attachAdminCookie(
      NextResponse.json({ authenticated: true }, { headers: noStoreHeaders() }),
    );
  } catch (error) {
    if (error instanceof MissingAdminConfigurationError) {
      return apiError("ADMIN_NOT_CONFIGURED", "Yönetim erişimi henüz yapılandırılmadı.", 503);
    }
    console.error("Admin login failed", error);
    return apiError("ADMIN_LOGIN_FAILED", "Yönetim girişi yapılamadı.", 500);
  }
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return apiError("INVALID_ORIGIN", "İstek doğrulanamadı.", 403, noStoreHeaders());
  }
  return clearAdminCookie(
    NextResponse.json({ authenticated: false }, { headers: noStoreHeaders() }),
  );
}

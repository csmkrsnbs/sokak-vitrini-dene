import { NextRequest, NextResponse } from "next/server";

import type { ApiErrorBody } from "@/lib/types";

export const SESSION_COOKIE = "sv_try_session";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getSession(request: NextRequest) {
  const current = request.cookies.get(SESSION_COOKIE)?.value;
  if (current && UUID_PATTERN.test(current)) {
    return { id: current, isNew: false };
  }

  return { id: crypto.randomUUID(), isNew: true };
}

export function attachSessionCookie<T extends NextResponse>(
  response: T,
  session: { id: string; isNew: boolean },
) {
  if (!session.isNew) return response;

  response.cookies.set({
    name: SESSION_COOKIE,
    value: session.id,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

export function apiError(
  code: string,
  message: string,
  status: number,
  headers?: HeadersInit,
) {
  return NextResponse.json<ApiErrorBody>(
    { error: { code, message } },
    { status, headers },
  );
}

export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const forwardedHost = request.headers.get("x-forwarded-host");
    const requestHost = forwardedHost ?? request.headers.get("host");
    return Boolean(requestHost && originUrl.host === requestHost);
  } catch {
    return false;
  }
}

export function noStoreHeaders() {
  return {
    "Cache-Control": "no-store, max-age=0",
    Pragma: "no-cache",
  };
}

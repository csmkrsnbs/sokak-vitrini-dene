import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

export const ADMIN_COOKIE = "sv_coupon_admin";
const ADMIN_SESSION_SECONDS = 60 * 60 * 12;

export class MissingAdminConfigurationError extends Error {
  constructor() {
    super("ADMIN_ACCESS_KEY tanımlı değil.");
    this.name = "MissingAdminConfigurationError";
  }
}

function adminSecret() {
  const secret = process.env.ADMIN_ACCESS_KEY?.trim();
  if (!secret || secret.length < 32) throw new MissingAdminConfigurationError();
  return secret;
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

function safeEqual(left: string, right: string) {
  return timingSafeEqual(digest(left), digest(right));
}

function signature(expiresAt: string) {
  return createHmac("sha256", adminSecret()).update(expiresAt).digest("hex");
}

export function verifyAdminAccessKey(value: string) {
  return safeEqual(value, adminSecret());
}

export function isAdminAuthenticated(request: NextRequest) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const [expiresAt, tokenSignature] = token.split(".");
  if (!expiresAt || !tokenSignature || !/^\d+$/.test(expiresAt)) return false;
  if (Number(expiresAt) <= Date.now()) return false;
  return safeEqual(tokenSignature, signature(expiresAt));
}

export function attachAdminCookie<T extends NextResponse>(response: T) {
  const expiresAt = String(Date.now() + ADMIN_SESSION_SECONDS * 1_000);
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: `${expiresAt}.${signature(expiresAt)}`,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
  return response;
}

export function clearAdminCookie<T extends NextResponse>(response: T) {
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

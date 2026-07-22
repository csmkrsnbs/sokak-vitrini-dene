import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

export const COUPON_COOKIE = "sv_credit_coupon";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class MissingCouponConfigurationError extends Error {
  constructor() {
    super("COUPON_SIGNING_SECRET tanımlı değil.");
    this.name = "MissingCouponConfigurationError";
  }
}

function couponSecret() {
  const secret = process.env.COUPON_SIGNING_SECRET?.trim();
  if (!secret || secret.length < 32) throw new MissingCouponConfigurationError();
  return secret;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function normalizeCouponCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function generateCouponCode() {
  const value = randomBytes(10).toString("hex").toUpperCase();
  return `SV-${value.match(/.{1,4}/g)?.join("-") ?? value}`;
}

export function hashCouponCode(code: string) {
  return createHmac("sha256", couponSecret())
    .update(normalizeCouponCode(code))
    .digest("hex");
}

function signCouponId(couponId: string) {
  return createHmac("sha256", couponSecret()).update(`session:${couponId}`).digest("hex");
}

export function getCouponId(request: NextRequest) {
  const token = request.cookies.get(COUPON_COOKIE)?.value;
  if (!token) return null;

  const [couponId, signature] = token.split(".");
  if (!couponId || !signature || !UUID_PATTERN.test(couponId)) return null;
  return safeEqual(signature, signCouponId(couponId)) ? couponId : null;
}

export function attachCouponCookie<T extends NextResponse>(response: T, couponId: string) {
  response.cookies.set({
    name: COUPON_COOKIE,
    value: `${couponId}.${signCouponId(couponId)}`,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

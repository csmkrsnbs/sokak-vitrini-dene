export const FREE_PREVIEW_LIMIT = 2;

export const STANDARD_PACKAGE = {
  code: "standard" as const,
  title: "Standart Paket",
  credits: 10,
  amountKurus: 10_000,
  priceLabel: "100 TL",
};

export type BankDetails = {
  name: string;
  accountHolder: string;
  iban: string;
};

export function getBankDetails(): BankDetails | null {
  const name = process.env.PAYMENT_BANK_NAME?.trim();
  const accountHolder = process.env.PAYMENT_ACCOUNT_HOLDER?.trim();
  const iban = process.env.PAYMENT_IBAN?.replace(/\s+/g, "").trim().toUpperCase();

  if (!name || !accountHolder || !iban || !/^TR\d{24}$/.test(iban)) return null;
  return { name, accountHolder, iban };
}

export function isPaymentConfigured() {
  const adminKey = process.env.ADMIN_ACCESS_KEY?.trim() ?? "";
  const couponSecret = process.env.COUPON_SIGNING_SECRET?.trim() ?? "";
  return Boolean(
    getBankDetails() &&
      adminKey.length >= 32 &&
      couponSecret.length >= 32,
  );
}

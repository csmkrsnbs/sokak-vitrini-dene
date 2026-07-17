import type { InferSelectModel } from "drizzle-orm";

import { paymentRequests } from "@/lib/db/schema";
import type {
  AdminPaymentRequestView,
  PaymentRequestStatus,
  PaymentRequestView,
} from "@/lib/types";
import type { BankDetails } from "@/lib/server/billing";
import { generateCouponCode } from "@/lib/server/coupons";

type PaymentRow = InferSelectModel<typeof paymentRequests>;

function paymentStatus(value: string): PaymentRequestStatus {
  if (value === "approved" || value === "rejected") return value;
  return "pending";
}

function basePaymentView(row: PaymentRow) {
  return {
    id: row.id,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    referenceCode: row.referenceCode,
    status: paymentStatus(row.status),
    amountKurus: row.amountKurus,
    priceLabel: `${(row.amountKurus / 100).toLocaleString("tr-TR")} TL`,
    credits: row.credits,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
  };
}

export function serializePayment(row: PaymentRow, bank: BankDetails): PaymentRequestView {
  return {
    ...basePaymentView(row),
    couponCode: row.status === "approved" ? generateCouponCode(row.id) : null,
    bank,
  };
}

export function serializeAdminPayment(row: PaymentRow): AdminPaymentRequestView {
  return basePaymentView(row);
}

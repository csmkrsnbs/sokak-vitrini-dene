import type { InferSelectModel } from "drizzle-orm";

import { couponCodes } from "@/lib/db/schema";
import type { AdminCouponStatus, AdminCouponView } from "@/lib/types";

type CouponRow = InferSelectModel<typeof couponCodes>;

function couponStatus(row: CouponRow): AdminCouponStatus {
  if (row.status === "revoked") return "revoked";
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) return "expired";
  if (row.status === "exhausted" || row.remainingCredits <= 0) return "exhausted";
  return "active";
}

export function serializeAdminCoupon(row: CouponRow): AdminCouponView {
  return {
    id: row.id,
    label: row.label,
    status: couponStatus(row),
    totalCredits: row.totalCredits,
    remainingCredits: Math.max(0, row.remainingCredits),
    createdAt: row.createdAt.toISOString(),
    activatedAt: row.activatedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
  };
}

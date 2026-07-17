import type { Metadata } from "next";

import { CouponAdmin } from "@/components/coupon-admin";

export const metadata: Metadata = {
  title: "Kupon Yönetimi",
  robots: { index: false, follow: false },
};

export default function CouponAdminPage() {
  return <CouponAdmin />;
}

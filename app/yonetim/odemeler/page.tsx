import type { Metadata } from "next";

import { PaymentAdmin } from "@/components/payment-admin";

export const metadata: Metadata = {
  title: "Ödeme Yönetimi",
  robots: { index: false, follow: false },
};

export default function PaymentAdminPage() {
  return <PaymentAdmin />;
}

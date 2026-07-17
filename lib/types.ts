export const previewCategories = [
  "jewelry",
  "clothing",
  "furniture",
  "car",
] as const;

export type PreviewCategory = (typeof previewCategories)[number];

export type PreviewStatus = "processing" | "completed" | "failed";

export type PreviewListItem = {
  id: string;
  category: PreviewCategory;
  note: string | null;
  status: PreviewStatus;
  imageUrl: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type PreviewResponse = {
  preview: PreviewListItem;
  access: AccessState;
};

export type AccessState = {
  free: {
    limit: number;
    used: number;
    remaining: number;
  };
  coupon: {
    active: boolean;
    total: number;
    remaining: number;
  } | null;
  package: {
    code: "standard";
    title: string;
    credits: number;
    amountKurus: number;
    priceLabel: string;
  };
  paymentConfigured: boolean;
};

export type PaymentRequestStatus = "pending" | "approved" | "rejected";

export type PaymentRequestView = {
  id: string;
  customerName: string;
  customerEmail: string;
  referenceCode: string;
  status: PaymentRequestStatus;
  amountKurus: number;
  priceLabel: string;
  credits: number;
  createdAt: string;
  reviewedAt: string | null;
  couponCode: string | null;
  bank: {
    name: string;
    accountHolder: string;
    iban: string;
  };
};

export type AdminPaymentRequestView = Omit<PaymentRequestView, "couponCode" | "bank">;

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

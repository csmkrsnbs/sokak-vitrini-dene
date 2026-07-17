export const previewCategories = [
  "jewelry",
  "clothing",
  "furniture",
  "car",
] as const;

export type PreviewCategory = (typeof previewCategories)[number];

export type PreviewStatus = "processing" | "completed" | "failed";

export type PreviewProviderStatus =
  | "SUBMITTING"
  | "IN_QUEUE"
  | "IN_PROGRESS"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "ERROR"
  | "CANCELLED"
  | "TIMED_OUT"
  | "UNKNOWN";

export type PreviewListItem = {
  id: string;
  category: PreviewCategory;
  note: string | null;
  status: PreviewStatus;
  providerStatus: PreviewProviderStatus | null;
  imageUrl: string | null;
  createdAt: string;
  completedAt: string | null;
};

export type PreviewResponse = {
  preview: PreviewListItem;
  access: AccessState;
};

export type PreviewStatusResponse = PreviewResponse & {
  terminalError: {
    code: string;
    message: string;
  } | null;
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
};

export type AdminCouponStatus = "active" | "exhausted" | "expired" | "revoked";

export type AdminCouponView = {
  id: string;
  label: string;
  status: AdminCouponStatus;
  totalCredits: number;
  remainingCredits: number;
  createdAt: string;
  activatedAt: string | null;
  expiresAt: string | null;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

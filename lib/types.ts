export const previewCategories = [
  "clothing",
  "jewelry",
  "shoes",
  "bag",
  "accessory",
] as const;

export type PreviewCategory = (typeof previewCategories)[number];

export const previewModes = ["personal", "studio"] as const;

export type PreviewMode = (typeof previewModes)[number];

export const clothingTypes = ["tops", "bottoms", "one-pieces"] as const;

export type ClothingType = (typeof clothingTypes)[number];

export const garmentPhotoTypes = ["auto", "flat-lay", "model"] as const;

export type GarmentPhotoType = (typeof garmentPhotoTypes)[number];

export const productKinds = [
  "tshirt",
  "shirt",
  "blouse",
  "jacket",
  "dress",
  "pants",
  "skirt",
  "bikini",
  "swimsuit",
  "bra",
  "underwear",
  "corset",
  "bodysuit",
  "fantasy",
  "necklace",
  "earrings",
  "bracelet",
  "watch",
  "shoes",
  "bag",
  "glasses",
  "hat",
  "accessory",
] as const;

export type ProductKind = (typeof productKinds)[number];

export type PreviewStatus = "processing" | "completed" | "failed";

export type PreviewProviderStatus =
  | "SUBMITTING"
  | "STARTING"
  | "IN_QUEUE"
  | "IN_PROGRESS"
  | "PROCESSING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "ERROR"
  | "CANCELLED"
  | "TIMED_OUT"
  | "UNKNOWN";

export type PreviewListItem = {
  id: string;
  mode: PreviewMode;
  category: PreviewCategory;
  productKind: ProductKind;
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

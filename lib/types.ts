export type StudioMode = "360" | "mannequin" | "personal" | "ar";
export type GarmentCategory = "tops" | "bottoms" | "one-pieces" | "two-piece";
export type GarmentPhotoType = "auto" | "flat-lay" | "model";
export type CollectionType = "general" | "private";
export type MannequinSize = "s" | "m" | "l" | "xl";

export type FidelityMetrics = {
  accepted: boolean;
  overall: number;
  color: number;
  structure: number;
  grade: "high" | "medium" | "low";
  message: string;
};

export type TryOnResponse = {
  imageDataUrl: string | null;
  model: string;
  processingMs: number;
  metrics: FidelityMetrics;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

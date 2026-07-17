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
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

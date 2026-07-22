import type { InferSelectModel } from "drizzle-orm";

import { previewRequests } from "@/lib/db/schema";
import type { PreviewListItem } from "@/lib/types";

type PreviewRow = Pick<
  InferSelectModel<typeof previewRequests>,
  | "id"
  | "mode"
  | "category"
  | "productKind"
  | "note"
  | "status"
  | "providerStatus"
  | "createdAt"
  | "completedAt"
>;

export const previewListSelection = {
  id: previewRequests.id,
  mode: previewRequests.mode,
  category: previewRequests.category,
  productKind: previewRequests.productKind,
  note: previewRequests.note,
  status: previewRequests.status,
  providerStatus: previewRequests.providerStatus,
  createdAt: previewRequests.createdAt,
  completedAt: previewRequests.completedAt,
};

export function serializePreview(row: PreviewRow): PreviewListItem {
  return {
    id: row.id,
    mode: row.mode,
    category: row.category,
    productKind: row.productKind,
    note: row.note,
    status: row.status,
    providerStatus: row.providerStatus,
    imageUrl: row.status === "completed" ? `/api/previews/${row.id}/image` : null,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

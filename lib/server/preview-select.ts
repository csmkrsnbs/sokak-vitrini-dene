import type { InferSelectModel } from "drizzle-orm";

import { previewRequests } from "@/lib/db/schema";
import type { PreviewListItem } from "@/lib/types";

type PreviewRow = Pick<
  InferSelectModel<typeof previewRequests>,
  "id" | "category" | "note" | "status" | "createdAt" | "completedAt"
>;

export const previewListSelection = {
  id: previewRequests.id,
  category: previewRequests.category,
  note: previewRequests.note,
  status: previewRequests.status,
  createdAt: previewRequests.createdAt,
  completedAt: previewRequests.completedAt,
};

export function serializePreview(row: PreviewRow): PreviewListItem {
  return {
    id: row.id,
    category: row.category,
    note: row.note,
    status: row.status,
    imageUrl: row.status === "completed" ? `/api/previews/${row.id}/image` : null,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

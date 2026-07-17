import { index, integer, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

import type { PreviewCategory, PreviewStatus } from "@/lib/types";

export const previewRequests = pgTable(
  "preview_requests",
  {
    id: uuid("id").primaryKey(),
    sessionId: varchar("session_id", { length: 64 }).notNull(),
    clientKey: varchar("client_key", { length: 64 }).notNull(),
    category: varchar("category", { length: 24 }).$type<PreviewCategory>().notNull(),
    note: varchar("note", { length: 300 }),
    status: varchar("status", { length: 24 })
      .$type<PreviewStatus>()
      .notNull()
      .default("processing"),
    model: varchar("model", { length: 80 }).notNull(),
    resultImageBase64: text("result_image_base64"),
    resultMime: varchar("result_mime", { length: 48 }),
    resultBytes: integer("result_bytes"),
    errorCode: varchar("error_code", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("preview_requests_session_created_idx").on(table.sessionId, table.createdAt),
    index("preview_requests_client_created_idx").on(table.clientKey, table.createdAt),
    index("preview_requests_status_created_idx").on(table.status, table.createdAt),
  ],
);

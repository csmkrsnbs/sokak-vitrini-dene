import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

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
    creditSource: varchar("credit_source", { length: 16 }),
    couponId: uuid("coupon_id"),
    creditRefundedAt: timestamp("credit_refunded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("preview_requests_session_created_idx").on(table.sessionId, table.createdAt),
    index("preview_requests_client_created_idx").on(table.clientKey, table.createdAt),
    index("preview_requests_status_created_idx").on(table.status, table.createdAt),
  ],
);

export const freeUsageEvents = pgTable(
  "free_usage_events",
  {
    previewId: uuid("preview_id").primaryKey(),
    sessionId: varchar("session_id", { length: 64 }).notNull(),
    clientKey: varchar("client_key", { length: 64 }).notNull(),
    slot: integer("slot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("free_usage_session_slot_uidx").on(table.sessionId, table.slot),
    uniqueIndex("free_usage_client_slot_uidx").on(table.clientKey, table.slot),
    index("free_usage_session_idx").on(table.sessionId),
    index("free_usage_client_idx").on(table.clientKey),
  ],
);

export const paymentRequests = pgTable(
  "payment_requests",
  {
    id: uuid("id").primaryKey(),
    sessionId: varchar("session_id", { length: 64 }).notNull(),
    clientKey: varchar("client_key", { length: 64 }).notNull(),
    customerName: varchar("customer_name", { length: 120 }).notNull(),
    customerEmail: varchar("customer_email", { length: 254 }).notNull(),
    referenceCode: varchar("reference_code", { length: 24 }).notNull(),
    packageCode: varchar("package_code", { length: 32 }).notNull(),
    amountKurus: integer("amount_kurus").notNull(),
    credits: integer("credits").notNull(),
    status: varchar("status", { length: 24 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("payment_requests_reference_uidx").on(table.referenceCode),
    index("payment_requests_session_created_idx").on(table.sessionId, table.createdAt),
    index("payment_requests_status_created_idx").on(table.status, table.createdAt),
  ],
);

export const couponCodes = pgTable(
  "coupon_codes",
  {
    id: uuid("id").primaryKey(),
    paymentRequestId: uuid("payment_request_id").notNull(),
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    totalCredits: integer("total_credits").notNull(),
    remainingCredits: integer("remaining_credits").notNull(),
    status: varchar("status", { length: 24 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("coupon_codes_payment_request_uidx").on(table.paymentRequestId),
    uniqueIndex("coupon_codes_hash_uidx").on(table.codeHash),
    index("coupon_codes_status_idx").on(table.status),
  ],
);

import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import type {
  PreviewCategory,
  PreviewMode,
  ProductKind,
  PreviewProviderStatus,
  PreviewStatus,
} from "@/lib/types";

export const previewRequests = pgTable(
  "preview_requests",
  {
    id: uuid("id").primaryKey(),
    sessionId: varchar("session_id", { length: 64 }).notNull(),
    clientKey: varchar("client_key", { length: 64 }).notNull(),
    mode: varchar("mode", { length: 24 }).$type<PreviewMode>().notNull().default("personal"),
    category: varchar("category", { length: 24 }).$type<PreviewCategory>().notNull(),
    productKind: varchar("product_kind", { length: 32 }).$type<ProductKind>().notNull().default("accessory"),
    note: varchar("note", { length: 300 }),
    status: varchar("status", { length: 24 })
      .$type<PreviewStatus>()
      .notNull()
      .default("processing"),
    model: varchar("model", { length: 80 }).notNull(),
    providerJobId: varchar("provider_job_id", { length: 160 }),
    providerStatus: varchar("provider_status", { length: 24 }).$type<PreviewProviderStatus>(),
    providerSubmittedAt: timestamp("provider_submitted_at", { withTimezone: true }),
    providerCheckedAt: timestamp("provider_checked_at", { withTimezone: true }),
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
    uniqueIndex("preview_requests_provider_job_uidx").on(table.providerJobId),
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

export const networkRiskChecks = pgTable(
  "network_risk_checks",
  {
    clientKey: varchar("client_key", { length: 64 }).primaryKey(),
    anonymousNetwork: boolean("anonymous_network").notNull(),
    riskType: varchar("risk_type", { length: 24 }).notNull(),
    fraudScore: integer("fraud_score"),
    checkedAt: timestamp("checked_at", { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("network_risk_checks_expires_idx").on(table.expiresAt)],
);

export const dailyGenerationEvents = pgTable(
  "daily_generation_events",
  {
    previewId: uuid("preview_id").primaryKey(),
    dayKey: varchar("day_key", { length: 10 }).notNull(),
    slot: integer("slot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("daily_generation_day_slot_uidx").on(table.dayKey, table.slot),
    index("daily_generation_created_idx").on(table.createdAt),
  ],
);

export const couponCodes = pgTable(
  "coupon_codes",
  {
    id: uuid("id").primaryKey(),
    label: varchar("label", { length: 120 }).notNull().default("Kupon"),
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    totalCredits: integer("total_credits").notNull(),
    remainingCredits: integer("remaining_credits").notNull(),
    status: varchar("status", { length: 24 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    claimedSessionId: varchar("claimed_session_id", { length: 64 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("coupon_codes_hash_uidx").on(table.codeHash),
    index("coupon_codes_status_idx").on(table.status),
    index("coupon_codes_claimed_session_idx").on(table.claimedSessionId),
    index("coupon_codes_expires_idx").on(table.expiresAt),
  ],
);

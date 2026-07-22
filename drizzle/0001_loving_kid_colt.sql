CREATE TABLE "coupon_codes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"payment_request_id" uuid NOT NULL,
	"code_hash" varchar(64) NOT NULL,
	"total_credits" integer NOT NULL,
	"remaining_credits" integer NOT NULL,
	"status" varchar(24) DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"activated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "free_usage_events" (
	"preview_id" uuid PRIMARY KEY NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"client_key" varchar(64) NOT NULL,
	"slot" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"client_key" varchar(64) NOT NULL,
	"customer_name" varchar(120) NOT NULL,
	"customer_email" varchar(254) NOT NULL,
	"reference_code" varchar(24) NOT NULL,
	"package_code" varchar(32) NOT NULL,
	"amount_kurus" integer NOT NULL,
	"credits" integer NOT NULL,
	"status" varchar(24) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "preview_requests" ADD COLUMN "credit_source" varchar(16);--> statement-breakpoint
ALTER TABLE "preview_requests" ADD COLUMN "coupon_id" uuid;--> statement-breakpoint
ALTER TABLE "preview_requests" ADD COLUMN "credit_refunded_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_codes_payment_request_uidx" ON "coupon_codes" USING btree ("payment_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_codes_hash_uidx" ON "coupon_codes" USING btree ("code_hash");--> statement-breakpoint
CREATE INDEX "coupon_codes_status_idx" ON "coupon_codes" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "free_usage_session_slot_uidx" ON "free_usage_events" USING btree ("session_id","slot");--> statement-breakpoint
CREATE UNIQUE INDEX "free_usage_client_slot_uidx" ON "free_usage_events" USING btree ("client_key","slot");--> statement-breakpoint
CREATE INDEX "free_usage_session_idx" ON "free_usage_events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "free_usage_client_idx" ON "free_usage_events" USING btree ("client_key");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_requests_reference_uidx" ON "payment_requests" USING btree ("reference_code");--> statement-breakpoint
CREATE INDEX "payment_requests_session_created_idx" ON "payment_requests" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "payment_requests_status_created_idx" ON "payment_requests" USING btree ("status","created_at");
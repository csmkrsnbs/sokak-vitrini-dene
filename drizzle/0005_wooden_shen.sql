CREATE TABLE "daily_generation_events" (
	"preview_id" uuid PRIMARY KEY NOT NULL,
	"day_key" varchar(10) NOT NULL,
	"slot" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_requests" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "payment_requests" CASCADE;--> statement-breakpoint
DROP INDEX "coupon_codes_payment_request_uidx";--> statement-breakpoint
ALTER TABLE "coupon_codes" ADD COLUMN "label" varchar(120) DEFAULT 'Kupon' NOT NULL;--> statement-breakpoint
ALTER TABLE "coupon_codes" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "daily_generation_day_slot_uidx" ON "daily_generation_events" USING btree ("day_key","slot");--> statement-breakpoint
CREATE INDEX "daily_generation_created_idx" ON "daily_generation_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "coupon_codes_expires_idx" ON "coupon_codes" USING btree ("expires_at");--> statement-breakpoint
ALTER TABLE "coupon_codes" DROP COLUMN "payment_request_id";
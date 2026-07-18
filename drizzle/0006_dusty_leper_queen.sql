ALTER TABLE "coupon_codes" ADD COLUMN "claimed_session_id" varchar(64);--> statement-breakpoint
CREATE INDEX "coupon_codes_claimed_session_idx" ON "coupon_codes" USING btree ("claimed_session_id");
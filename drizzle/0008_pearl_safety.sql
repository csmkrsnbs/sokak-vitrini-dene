ALTER TABLE "preview_requests" ADD COLUMN "provider_credits" integer;
--> statement-breakpoint
CREATE TABLE "request_rate_limits" (
  "key" varchar(80) PRIMARY KEY NOT NULL,
  "hits" integer DEFAULT 0 NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "request_rate_limits_expires_idx" ON "request_rate_limits" USING btree ("expires_at");

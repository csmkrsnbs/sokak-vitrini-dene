ALTER TABLE "preview_requests" ADD COLUMN "provider_job_id" varchar(160);--> statement-breakpoint
ALTER TABLE "preview_requests" ADD COLUMN "provider_status" varchar(24);--> statement-breakpoint
ALTER TABLE "preview_requests" ADD COLUMN "provider_submitted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "preview_requests" ADD COLUMN "provider_checked_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "preview_requests_provider_job_uidx" ON "preview_requests" USING btree ("provider_job_id");
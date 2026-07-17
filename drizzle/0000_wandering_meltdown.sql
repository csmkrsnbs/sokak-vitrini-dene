CREATE TABLE "preview_requests" (
	"id" uuid PRIMARY KEY NOT NULL,
	"session_id" varchar(64) NOT NULL,
	"client_key" varchar(64) NOT NULL,
	"category" varchar(24) NOT NULL,
	"note" varchar(300),
	"status" varchar(24) DEFAULT 'processing' NOT NULL,
	"model" varchar(80) NOT NULL,
	"result_image_base64" text,
	"result_mime" varchar(48),
	"result_bytes" integer,
	"error_code" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "preview_requests_session_created_idx" ON "preview_requests" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "preview_requests_client_created_idx" ON "preview_requests" USING btree ("client_key","created_at");--> statement-breakpoint
CREATE INDEX "preview_requests_status_created_idx" ON "preview_requests" USING btree ("status","created_at");
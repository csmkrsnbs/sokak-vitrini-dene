ALTER TABLE "preview_requests" ADD COLUMN "mode" varchar(24) DEFAULT 'personal' NOT NULL;--> statement-breakpoint
ALTER TABLE "preview_requests" ADD COLUMN "product_kind" varchar(32) DEFAULT 'accessory' NOT NULL;--> statement-breakpoint
UPDATE "preview_requests"
SET "product_kind" = CASE
  WHEN "category" = 'clothing' THEN 'shirt'
  WHEN "category" = 'jewelry' THEN 'necklace'
  ELSE 'accessory'
END;
--> statement-breakpoint
UPDATE "preview_requests"
SET "category" = 'accessory'
WHERE "category" NOT IN ('clothing', 'jewelry', 'shoes', 'bag', 'accessory');

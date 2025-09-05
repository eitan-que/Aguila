ALTER TABLE "discount_qr_scan" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "discount_redemption" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "discount_usage" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "discount_view" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "interaction_event" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_discount" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "restaurant_cost" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "restaurant_visit" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "visitor" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "discount_qr_scan" CASCADE;--> statement-breakpoint
DROP TABLE "discount_redemption" CASCADE;--> statement-breakpoint
DROP TABLE "discount_usage" CASCADE;--> statement-breakpoint
DROP TABLE "discount_view" CASCADE;--> statement-breakpoint
DROP TABLE "interaction_event" CASCADE;--> statement-breakpoint
DROP TABLE "product_discount" CASCADE;--> statement-breakpoint
DROP TABLE "restaurant_cost" CASCADE;--> statement-breakpoint
DROP TABLE "restaurant_visit" CASCADE;--> statement-breakpoint
DROP TABLE "visitor" CASCADE;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "picture_url" text;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "picture_alt" text;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "icon_url" text;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "icon_alt" text;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "weight" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "image_alt" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "discount_id" text;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "tags" json;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "rating" integer;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "picture_url" text;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "picture_alt" text;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "prep_time_min" integer;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "prep_time_max" integer;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "highest_percentage_discount" integer;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "weight" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "tags" json;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "lat" integer;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "lon" integer;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_discount_id_discount_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."discount"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "category_weight_idx" ON "category" USING btree ("weight");--> statement-breakpoint
CREATE INDEX "product_discount_id_idx" ON "product" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "restaurant_slug_idx" ON "restaurant" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "restaurant_weight_idx" ON "restaurant" USING btree ("weight");
ALTER TABLE "category" DROP CONSTRAINT "category_restaurant_id_restaurant_id_fk";
--> statement-breakpoint
DROP INDEX "category_restaurant_id_idx";--> statement-breakpoint
DROP INDEX "category_weight_idx";--> statement-breakpoint
DROP INDEX "discount_date_range_idx";--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "category_id" text;--> statement-breakpoint
ALTER TABLE "restaurant" ADD CONSTRAINT "restaurant_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "restaurant_id";--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "picture_url";--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "picture_alt";--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "icon_url";--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "icon_alt";--> statement-breakpoint
ALTER TABLE "category" DROP COLUMN "weight";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "value";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "buy_quantity";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "get_quantity";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "start_date";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "end_date";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "max_uses";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "max_uses_per_user";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "current_uses";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "requires_auth";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "valid_days";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "discount" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "restaurant" DROP COLUMN "weight";
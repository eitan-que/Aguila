ALTER TABLE "product" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "product" CASCADE;--> statement-breakpoint
DROP INDEX "account_user_id_idx";--> statement-breakpoint
DROP INDEX "restaurant_slug_idx";--> statement-breakpoint
DROP INDEX "restaurant_weight_idx";--> statement-breakpoint
DROP INDEX "user_email_idx";--> statement-breakpoint
ALTER TABLE "discount" ALTER COLUMN "restaurant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "discount" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "discount" ADD COLUMN "image_alt" text;
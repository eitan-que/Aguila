ALTER TABLE "category" ADD COLUMN "weight" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "popularity_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "last_boost_at" timestamp;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "weight" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "popularity_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "last_boost_at" timestamp;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "weight" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "popularity_score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "restaurant" ADD COLUMN "last_boost_at" timestamp;
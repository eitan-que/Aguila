-- Migration: add boosting / ordering fields to restaurant, category, product
ALTER TABLE "restaurant" ADD COLUMN IF NOT EXISTS "weight" integer DEFAULT 0 NOT NULL;
ALTER TABLE "restaurant" ADD COLUMN IF NOT EXISTS "popularity_score" integer DEFAULT 0 NOT NULL;
ALTER TABLE "restaurant" ADD COLUMN IF NOT EXISTS "last_boost_at" timestamp;

ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "weight" integer DEFAULT 0 NOT NULL;
ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "popularity_score" integer DEFAULT 0 NOT NULL;
ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "last_boost_at" timestamp;

ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "weight" integer DEFAULT 0 NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "popularity_score" integer DEFAULT 0 NOT NULL;
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "last_boost_at" timestamp;

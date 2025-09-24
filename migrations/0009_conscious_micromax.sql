CREATE TABLE "discount_category" (
	"discount_id" text NOT NULL,
	"category_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "discount_category_discount_id_category_id_pk" PRIMARY KEY("discount_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "restaurant_category" (
	"restaurant_id" text NOT NULL,
	"category_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "restaurant_category_restaurant_id_category_id_pk" PRIMARY KEY("restaurant_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "restaurant" DROP CONSTRAINT "restaurant_category_id_category_id_fk";
--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "discount_category" ADD CONSTRAINT "discount_category_discount_id_discount_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."discount"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_category" ADD CONSTRAINT "discount_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_category" ADD CONSTRAINT "restaurant_category_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_category" ADD CONSTRAINT "restaurant_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant" DROP COLUMN "category_id";
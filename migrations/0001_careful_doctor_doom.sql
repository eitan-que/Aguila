CREATE TABLE "discount_qr_scan" (
	"id" text PRIMARY KEY NOT NULL,
	"discount_id" text,
	"token_nonce" text,
	"success" boolean NOT NULL,
	"user_id" text,
	"visitor_id" text,
	"scanned_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_redemption" (
	"id" text PRIMARY KEY NOT NULL,
	"discount_id" text NOT NULL,
	"restaurant_id" text,
	"user_id" text,
	"visitor_id" text,
	"redeemed_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_view" (
	"id" text PRIMARY KEY NOT NULL,
	"discount_id" text NOT NULL,
	"restaurant_id" text,
	"user_id" text,
	"visitor_id" text,
	"occurred_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interaction_event" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"restaurant_id" text,
	"user_id" text,
	"visitor_id" text,
	"occurred_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_cost" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"spend_minor_units" integer NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "restaurant_visit" (
	"id" text PRIMARY KEY NOT NULL,
	"restaurant_id" text NOT NULL,
	"user_id" text,
	"visitor_id" text,
	"occurred_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "visitor" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"created_at" timestamp NOT NULL,
	"last_visit_at" timestamp NOT NULL,
	"visit_count" integer NOT NULL,
	CONSTRAINT "visitor_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "discount_qr_scan" ADD CONSTRAINT "discount_qr_scan_discount_id_discount_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."discount"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_qr_scan" ADD CONSTRAINT "discount_qr_scan_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_qr_scan" ADD CONSTRAINT "discount_qr_scan_visitor_id_visitor_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_discount_id_discount_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."discount"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_redemption" ADD CONSTRAINT "discount_redemption_visitor_id_visitor_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_view" ADD CONSTRAINT "discount_view_discount_id_discount_id_fk" FOREIGN KEY ("discount_id") REFERENCES "public"."discount"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_view" ADD CONSTRAINT "discount_view_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_view" ADD CONSTRAINT "discount_view_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discount_view" ADD CONSTRAINT "discount_view_visitor_id_visitor_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction_event" ADD CONSTRAINT "interaction_event_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction_event" ADD CONSTRAINT "interaction_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interaction_event" ADD CONSTRAINT "interaction_event_visitor_id_visitor_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_cost" ADD CONSTRAINT "restaurant_cost_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_visit" ADD CONSTRAINT "restaurant_visit_restaurant_id_restaurant_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_visit" ADD CONSTRAINT "restaurant_visit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_visit" ADD CONSTRAINT "restaurant_visit_visitor_id_visitor_id_fk" FOREIGN KEY ("visitor_id") REFERENCES "public"."visitor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor" ADD CONSTRAINT "visitor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "discount_qr_scan_discount_id_idx" ON "discount_qr_scan" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "discount_qr_scan_scanned_at_idx" ON "discount_qr_scan" USING btree ("scanned_at");--> statement-breakpoint
CREATE INDEX "discount_qr_scan_success_idx" ON "discount_qr_scan" USING btree ("success");--> statement-breakpoint
CREATE INDEX "discount_redemption_discount_id_idx" ON "discount_redemption" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "discount_redemption_redeemed_at_idx" ON "discount_redemption" USING btree ("redeemed_at");--> statement-breakpoint
CREATE INDEX "discount_view_discount_id_idx" ON "discount_view" USING btree ("discount_id");--> statement-breakpoint
CREATE INDEX "discount_view_occurred_at_idx" ON "discount_view" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "interaction_event_type_idx" ON "interaction_event" USING btree ("type");--> statement-breakpoint
CREATE INDEX "interaction_event_restaurant_id_idx" ON "interaction_event" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "interaction_event_occurred_at_idx" ON "interaction_event" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "restaurant_cost_restaurant_id_idx" ON "restaurant_cost" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "restaurant_cost_period_idx" ON "restaurant_cost" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "restaurant_visit_restaurant_id_idx" ON "restaurant_visit" USING btree ("restaurant_id");--> statement-breakpoint
CREATE INDEX "restaurant_visit_occurred_at_idx" ON "restaurant_visit" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "restaurant_visit_visitor_id_idx" ON "restaurant_visit" USING btree ("visitor_id");--> statement-breakpoint
CREATE INDEX "visitor_user_id_idx" ON "visitor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "visitor_last_visit_idx" ON "visitor" USING btree ("last_visit_at");
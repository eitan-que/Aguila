import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  primaryKey,
  json,
  bigint,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned"),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
}, (table) => ([
  index('user_email_idx').on(table.email),
]));

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  impersonatedBy: text("impersonated_by"),
}, (table) => [
  index('session_user_id_idx').on(table.userId),
  index('session_token_idx').on(table.token),
]);

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
}, (table) => ([
  index('account_user_id_idx').on(table.userId),
]));

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
}, (table) => [
  index('verification_identifier_idx').on(table.identifier),
]);

export const restaurant = pgTable("restaurant", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const category = pgTable("category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurant.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}, (table) => [
  index('category_restaurant_id_idx').on(table.restaurantId),
]);

export const product = pgTable("product", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  imageUrl: text("image_url"),
  categoryId: text("category_id")
    .references(() => category.id, { onDelete: "set null" }),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurant.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}, (table) => [
  index('product_category_id_idx').on(table.categoryId),
  index('product_restaurant_id_idx').on(table.restaurantId),
]);

export const discount = pgTable("discount", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  value: integer("value").notNull(),
  buyQuantity: integer("buy_quantity"),
  getQuantity: integer("get_quantity"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  maxUses: integer("max_uses"),
  maxUsesPerUser: integer("max_uses_per_user"),
  currentUses: integer("current_uses").default(0),
  requiresAuth: boolean("requires_auth").default(false).notNull(),
  validDays: json("valid_days").$type<{
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  }>().default({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: true,
    sunday: true,
  }),
  restaurantId: text("restaurant_id")
    .references(() => restaurant.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}, (table) => [
  index('discount_restaurant_id_idx').on(table.restaurantId),
  index('discount_date_range_idx').on(table.startDate, table.endDate),
]);

export const productDiscount = pgTable("product_discount", {
  productId: text("product_id")
    .notNull()
    .references(() => product.id, { onDelete: "cascade" }),
  discountId: text("discount_id")
    .notNull()
    .references(() => discount.id, { onDelete: "cascade" }),
}, (table) => [
  primaryKey(table.productId, table.discountId),
  index('product_discount_product_id_idx').on(table.productId),
  index('product_discount_discount_id_idx').on(table.discountId),
]);

export const discountUsage = pgTable("discount_usage", {
  id: text("id").primaryKey(),
  discountId: text("discount_id")
    .notNull()
    .references(() => discount.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  usageCount: integer("usage_count").default(0).notNull(),
  lastUsedAt: timestamp("last_used_at")
    .$defaultFn(() => /* @__PURE__ */ new Date()),
}, (table) => [
  index('discount_usage_discount_id_idx').on(table.discountId),
  index('discount_usage_user_id_idx').on(table.userId),
  index('discount_usage_unique_idx').on(table.discountId, table.userId),
]);

// =============== Analytics & Tracking Tables ===============

export const visitor = pgTable("visitor", {
  id: text("id").primaryKey(),            // uuid o fingerprint
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }).unique(),
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
  lastVisitAt: timestamp("last_visit_at").$defaultFn(() => new Date()).notNull(),
  visitCount: integer("visit_count").$defaultFn(() => 1).notNull(),
}, (t) => [
  index("visitor_user_id_idx").on(t.userId),
  index("visitor_last_visit_idx").on(t.lastVisitAt),
]);

export const restaurantVisit = pgTable("restaurant_visit", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull().references(() => restaurant.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  visitorId: text("visitor_id").references(() => visitor.id, { onDelete: "set null" }),
  occurredAt: timestamp("occurred_at").$defaultFn(() => new Date()).notNull(),
}, (t) => [
  index("restaurant_visit_restaurant_id_idx").on(t.restaurantId),
  index("restaurant_visit_occurred_at_idx").on(t.occurredAt),
  index("restaurant_visit_visitor_id_idx").on(t.visitorId),
]);

export const interactionEvent = pgTable("interaction_event", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // 'instagram_click' | 'share_click' | 'whatsapp_click' | 'location_click' | 'menu_click'
  restaurantId: text("restaurant_id").references(() => restaurant.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  visitorId: text("visitor_id").references(() => visitor.id, { onDelete: "set null" }),
  occurredAt: timestamp("occurred_at").$defaultFn(() => new Date()).notNull(),
}, (t) => [
  index("interaction_event_type_idx").on(t.type),
  index("interaction_event_restaurant_id_idx").on(t.restaurantId),
  index("interaction_event_occurred_at_idx").on(t.occurredAt),
]);

export const discountView = pgTable("discount_view", {
  id: text("id").primaryKey(),
  discountId: text("discount_id").notNull().references(() => discount.id, { onDelete: "cascade" }),
  restaurantId: text("restaurant_id").references(() => restaurant.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  visitorId: text("visitor_id").references(() => visitor.id, { onDelete: "set null" }),
  occurredAt: timestamp("occurred_at").$defaultFn(() => new Date()).notNull(),
}, (t) => [
  index("discount_view_discount_id_idx").on(t.discountId),
  index("discount_view_occurred_at_idx").on(t.occurredAt),
]);

export const discountQrScan = pgTable("discount_qr_scan", {
  id: text("id").primaryKey(),
  discountId: text("discount_id").references(() => discount.id, { onDelete: "set null" }),
  tokenNonce: text("token_nonce"),
  success: boolean("success").$defaultFn(() => false).notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  visitorId: text("visitor_id").references(() => visitor.id, { onDelete: "set null" }),
  scannedAt: timestamp("scanned_at").$defaultFn(() => new Date()).notNull(),
}, (t) => [
  index("discount_qr_scan_discount_id_idx").on(t.discountId),
  index("discount_qr_scan_scanned_at_idx").on(t.scannedAt),
  index("discount_qr_scan_success_idx").on(t.success),
]);

export const discountRedemption = pgTable("discount_redemption", {
  id: text("id").primaryKey(),
  discountId: text("discount_id").notNull().references(() => discount.id, { onDelete: "cascade" }),
  restaurantId: text("restaurant_id").references(() => restaurant.id, { onDelete: "set null" }),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  visitorId: text("visitor_id").references(() => visitor.id, { onDelete: "set null" }),
  redeemedAt: timestamp("redeemed_at").$defaultFn(() => new Date()).notNull(),
}, (t) => [
  index("discount_redemption_discount_id_idx").on(t.discountId),
  index("discount_redemption_redeemed_at_idx").on(t.redeemedAt),
]);

export const restaurantCost = pgTable("restaurant_cost", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull().references(() => restaurant.id, { onDelete: "cascade" }),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  spendMinorUnits: integer("spend_minor_units").notNull(), // en centavos
  createdAt: timestamp("created_at").$defaultFn(() => new Date()).notNull(),
}, (t) => [
  index("restaurant_cost_restaurant_id_idx").on(t.restaurantId),
  index("restaurant_cost_period_idx").on(t.periodStart, t.periodEnd),
]);

// ================= Types Inferidos =================
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Restaurant = typeof restaurant.$inferSelect;
export type NewRestaurant = typeof restaurant.$inferInsert;
export type Category = typeof category.$inferSelect;
export type NewCategory = typeof category.$inferInsert;
export type Product = typeof product.$inferSelect;
export type NewProduct = typeof product.$inferInsert;
export type Discount = typeof discount.$inferSelect;
export type NewDiscount = typeof discount.$inferInsert;
export type ProductDiscount = typeof productDiscount.$inferSelect;
export type DiscountUsage = typeof discountUsage.$inferSelect;
export type Visitor = typeof visitor.$inferSelect;
export type NewVisitor = typeof visitor.$inferInsert;
export type RestaurantVisit = typeof restaurantVisit.$inferSelect;
export type InteractionEvent = typeof interactionEvent.$inferSelect;
export type DiscountView = typeof discountView.$inferSelect;
export type DiscountQrScan = typeof discountQrScan.$inferSelect;
export type DiscountRedemption = typeof discountRedemption.$inferSelect;
export type RestaurantCost = typeof restaurantCost.$inferSelect;

export type WeekdayFlags = {
  monday: boolean; tuesday: boolean; wednesday: boolean; thursday: boolean; friday: boolean; saturday: boolean; sunday: boolean;
};
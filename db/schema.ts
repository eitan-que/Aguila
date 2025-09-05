import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  primaryKey,
  json,
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

// --------------------------------------------------
// Discount (moved above product so product can FK it)
// --------------------------------------------------
export const discount = pgTable("discount", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'percentage' | 'fixed'
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

export const restaurant = pgTable("restaurant", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  address: text("address"),
  // Extra fields required by UI components (see components/menu/sections/restaurants.tsx & banner.tsx)
  location: text("location"), // potentially different from full address, short location label
  pictureUrl: text("picture_url"),
  pictureAlt: text("picture_alt"),
  prepTimeMin: integer("prep_time_min"),
  prepTimeMax: integer("prep_time_max"),
  highestPercentageDiscount: integer("highest_percentage_discount"),
  weight: integer("weight").default(0).notNull(),
  tags: json("tags").$type<{ type: 'text'; text?: string }[]>(),
  lat: integer("lat"), // If higher precision is needed switch to doublePrecision
  lon: integer("lon"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}, (table) => ([
  index('restaurant_slug_idx').on(table.slug),
  index('restaurant_weight_idx').on(table.weight),
]));

export const category = pgTable("category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurant.id, { onDelete: "cascade" }),
  pictureUrl: text("picture_url"),
  pictureAlt: text("picture_alt"),
  iconUrl: text("icon_url"),
  iconAlt: text("icon_alt"),
  weight: integer("weight").default(0).notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}, (table) => [
  index('category_restaurant_id_idx').on(table.restaurantId),
  index('category_weight_idx').on(table.weight),
]);

export const product = pgTable("product", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(),
  imageUrl: text("image_url"),
  imageAlt: text("image_alt"),
  categoryId: text("category_id")
    .references(() => category.id, { onDelete: "set null" }),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurant.id, { onDelete: "cascade" }),
  // Relación 1:N directa: un producto puede tener un descuento principal activo.
  discountId: text("discount_id").references(() => discount.id, { onDelete: "set null" }),
  tags: json("tags").$type<{ type: 'text'; text?: string }[]>(),
  rating: integer("rating"), // consider decimal for precision later
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}, (table) => [
  index('product_category_id_idx').on(table.categoryId),
  index('product_restaurant_id_idx').on(table.restaurantId),
  index('product_discount_id_idx').on(table.discountId),
]);
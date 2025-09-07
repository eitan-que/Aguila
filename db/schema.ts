import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  json,
  numeric,
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
}, (table) => ({
  indexes: [
    index('user_email_idx').on(table.email),
  ],
}));

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
}, (table) => ({
  indexes: [
    index('account_user_id_idx').on(table.userId),
  ],
}));

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

// ---------------------
// Categorías 
// ---------------------
export const category = pgTable("category", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
})

// ---------------------
// Restaurantes
// ---------------------
export const restaurant = pgTable("restaurant", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  address: text("address"),
  // Referencia a la categoría a la que pertenece
  categoryId: text("category_id")
    .references(() => category.id, { onDelete: "set null" }),
  // Campos para UI
  pictureUrl: text("picture_url"),
  pictureAlt: text("picture_alt"),
  prepTimeMin: integer("prep_time_min"),
  prepTimeMax: integer("prep_time_max"),
  tags: json("tags").$type<string[]>(),
  lat: numeric("lat", { precision: 18, scale: 14 }),
  lon: numeric("lon", { precision: 18, scale: 14 }),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  menuPictureUrl: json("menu_picture_url").$type<string[]>(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
}, (table) => ({
  indexes: [
    index('restaurant_slug_idx').on(table.slug),
    index('restaurant_category_id_idx').on(table.categoryId),
  ],
}));

// ---------------------
// Descuentos (simplificados)
// ---------------------
export const discount = pgTable("discount", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  imageAlt: text("image_alt"),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurant.id, { onDelete: "cascade" }),
}, (table) => [
  index('discount_restaurant_id_idx').on(table.restaurantId),
]);
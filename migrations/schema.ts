import { pgTable, index, text, timestamp, unique, boolean, foreignKey, integer, json, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	index("verification_identifier_idx").using("btree", table.identifier.asc().nullsLast().op("text_ops")),
]);

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	role: text(),
	banned: boolean(),
	banReason: text("ban_reason"),
	banExpires: timestamp("ban_expires", { mode: 'string' }),
}, (table) => [
	index("user_email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("user_email_unique").on(table.email),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("account_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const discount = pgTable("discount", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	type: text().notNull(),
	value: integer().notNull(),
	buyQuantity: integer("buy_quantity"),
	getQuantity: integer("get_quantity"),
	startDate: timestamp("start_date", { mode: 'string' }).notNull(),
	endDate: timestamp("end_date", { mode: 'string' }).notNull(),
	maxUses: integer("max_uses"),
	maxUsesPerUser: integer("max_uses_per_user"),
	currentUses: integer("current_uses").default(0),
	requiresAuth: boolean("requires_auth").default(false).notNull(),
	validDays: json("valid_days").default({"monday":true,"tuesday":true,"wednesday":true,"thursday":true,"friday":true,"saturday":true,"sunday":true}),
	restaurantId: text("restaurant_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("discount_date_range_idx").using("btree", table.startDate.asc().nullsLast().op("timestamp_ops"), table.endDate.asc().nullsLast().op("timestamp_ops")),
	index("discount_restaurant_id_idx").using("btree", table.restaurantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurant.id],
			name: "discount_restaurant_id_restaurant_id_fk"
		}).onDelete("cascade"),
]);

export const discountUsage = pgTable("discount_usage", {
	id: text().primaryKey().notNull(),
	discountId: text("discount_id").notNull(),
	userId: text("user_id").notNull(),
	usageCount: integer("usage_count").default(0).notNull(),
	lastUsedAt: timestamp("last_used_at", { mode: 'string' }),
}, (table) => [
	index("discount_usage_discount_id_idx").using("btree", table.discountId.asc().nullsLast().op("text_ops")),
	index("discount_usage_unique_idx").using("btree", table.discountId.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("text_ops")),
	index("discount_usage_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.discountId],
			foreignColumns: [discount.id],
			name: "discount_usage_discount_id_discount_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "discount_usage_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const category = pgTable("category", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	restaurantId: text("restaurant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	weight: integer().default(0).notNull(),
	popularityScore: integer("popularity_score").default(0).notNull(),
	lastBoostAt: timestamp("last_boost_at", { mode: 'string' }),
}, (table) => [
	index("category_restaurant_id_idx").using("btree", table.restaurantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurant.id],
			name: "category_restaurant_id_restaurant_id_fk"
		}).onDelete("cascade"),
]);

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
	impersonatedBy: text("impersonated_by"),
}, (table) => [
	index("session_token_idx").using("btree", table.token.asc().nullsLast().op("text_ops")),
	index("session_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const discountQrScan = pgTable("discount_qr_scan", {
	id: text().primaryKey().notNull(),
	discountId: text("discount_id"),
	tokenNonce: text("token_nonce"),
	success: boolean().notNull(),
	userId: text("user_id"),
	visitorId: text("visitor_id"),
	scannedAt: timestamp("scanned_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("discount_qr_scan_discount_id_idx").using("btree", table.discountId.asc().nullsLast().op("text_ops")),
	index("discount_qr_scan_scanned_at_idx").using("btree", table.scannedAt.asc().nullsLast().op("timestamp_ops")),
	index("discount_qr_scan_success_idx").using("btree", table.success.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.discountId],
			foreignColumns: [discount.id],
			name: "discount_qr_scan_discount_id_discount_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "discount_qr_scan_user_id_user_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.visitorId],
			foreignColumns: [visitor.id],
			name: "discount_qr_scan_visitor_id_visitor_id_fk"
		}).onDelete("set null"),
]);

export const visitor = pgTable("visitor", {
	id: text().primaryKey().notNull(),
	userId: text("user_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	lastVisitAt: timestamp("last_visit_at", { mode: 'string' }).notNull(),
	visitCount: integer("visit_count").notNull(),
}, (table) => [
	index("visitor_last_visit_idx").using("btree", table.lastVisitAt.asc().nullsLast().op("timestamp_ops")),
	index("visitor_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "visitor_user_id_user_id_fk"
		}).onDelete("set null"),
	unique("visitor_user_id_unique").on(table.userId),
]);

export const discountRedemption = pgTable("discount_redemption", {
	id: text().primaryKey().notNull(),
	discountId: text("discount_id").notNull(),
	restaurantId: text("restaurant_id"),
	userId: text("user_id"),
	visitorId: text("visitor_id"),
	redeemedAt: timestamp("redeemed_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("discount_redemption_discount_id_idx").using("btree", table.discountId.asc().nullsLast().op("text_ops")),
	index("discount_redemption_redeemed_at_idx").using("btree", table.redeemedAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.discountId],
			foreignColumns: [discount.id],
			name: "discount_redemption_discount_id_discount_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurant.id],
			name: "discount_redemption_restaurant_id_restaurant_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "discount_redemption_user_id_user_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.visitorId],
			foreignColumns: [visitor.id],
			name: "discount_redemption_visitor_id_visitor_id_fk"
		}).onDelete("set null"),
]);

export const discountView = pgTable("discount_view", {
	id: text().primaryKey().notNull(),
	discountId: text("discount_id").notNull(),
	restaurantId: text("restaurant_id"),
	userId: text("user_id"),
	visitorId: text("visitor_id"),
	occurredAt: timestamp("occurred_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("discount_view_discount_id_idx").using("btree", table.discountId.asc().nullsLast().op("text_ops")),
	index("discount_view_occurred_at_idx").using("btree", table.occurredAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.discountId],
			foreignColumns: [discount.id],
			name: "discount_view_discount_id_discount_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurant.id],
			name: "discount_view_restaurant_id_restaurant_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "discount_view_user_id_user_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.visitorId],
			foreignColumns: [visitor.id],
			name: "discount_view_visitor_id_visitor_id_fk"
		}).onDelete("set null"),
]);

export const interactionEvent = pgTable("interaction_event", {
	id: text().primaryKey().notNull(),
	type: text().notNull(),
	restaurantId: text("restaurant_id"),
	userId: text("user_id"),
	visitorId: text("visitor_id"),
	occurredAt: timestamp("occurred_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("interaction_event_occurred_at_idx").using("btree", table.occurredAt.asc().nullsLast().op("timestamp_ops")),
	index("interaction_event_restaurant_id_idx").using("btree", table.restaurantId.asc().nullsLast().op("text_ops")),
	index("interaction_event_type_idx").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurant.id],
			name: "interaction_event_restaurant_id_restaurant_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "interaction_event_user_id_user_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.visitorId],
			foreignColumns: [visitor.id],
			name: "interaction_event_visitor_id_visitor_id_fk"
		}).onDelete("set null"),
]);

export const restaurantCost = pgTable("restaurant_cost", {
	id: text().primaryKey().notNull(),
	restaurantId: text("restaurant_id").notNull(),
	periodStart: timestamp("period_start", { mode: 'string' }).notNull(),
	periodEnd: timestamp("period_end", { mode: 'string' }).notNull(),
	spendMinorUnits: integer("spend_minor_units").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("restaurant_cost_period_idx").using("btree", table.periodStart.asc().nullsLast().op("timestamp_ops"), table.periodEnd.asc().nullsLast().op("timestamp_ops")),
	index("restaurant_cost_restaurant_id_idx").using("btree", table.restaurantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurant.id],
			name: "restaurant_cost_restaurant_id_restaurant_id_fk"
		}).onDelete("cascade"),
]);

export const restaurantVisit = pgTable("restaurant_visit", {
	id: text().primaryKey().notNull(),
	restaurantId: text("restaurant_id").notNull(),
	userId: text("user_id"),
	visitorId: text("visitor_id"),
	occurredAt: timestamp("occurred_at", { mode: 'string' }).notNull(),
}, (table) => [
	index("restaurant_visit_occurred_at_idx").using("btree", table.occurredAt.asc().nullsLast().op("timestamp_ops")),
	index("restaurant_visit_restaurant_id_idx").using("btree", table.restaurantId.asc().nullsLast().op("text_ops")),
	index("restaurant_visit_visitor_id_idx").using("btree", table.visitorId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurant.id],
			name: "restaurant_visit_restaurant_id_restaurant_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "restaurant_visit_user_id_user_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.visitorId],
			foreignColumns: [visitor.id],
			name: "restaurant_visit_visitor_id_visitor_id_fk"
		}).onDelete("set null"),
]);

export const restaurant = pgTable("restaurant", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	slug: text().notNull(),
	description: text(),
	address: text(),
	phone: text(),
	email: text(),
	website: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	weight: integer().default(0).notNull(),
	popularityScore: integer("popularity_score").default(0).notNull(),
	lastBoostAt: timestamp("last_boost_at", { mode: 'string' }),
}, (table) => [
	unique("restaurant_slug_unique").on(table.slug),
]);

export const product = pgTable("product", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	price: integer().notNull(),
	imageUrl: text("image_url"),
	categoryId: text("category_id"),
	restaurantId: text("restaurant_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	weight: integer().default(0).notNull(),
	popularityScore: integer("popularity_score").default(0).notNull(),
	lastBoostAt: timestamp("last_boost_at", { mode: 'string' }),
}, (table) => [
	index("product_category_id_idx").using("btree", table.categoryId.asc().nullsLast().op("text_ops")),
	index("product_restaurant_id_idx").using("btree", table.restaurantId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [category.id],
			name: "product_category_id_category_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.restaurantId],
			foreignColumns: [restaurant.id],
			name: "product_restaurant_id_restaurant_id_fk"
		}).onDelete("cascade"),
]);

export const productDiscount = pgTable("product_discount", {
	productId: text("product_id").notNull(),
	discountId: text("discount_id").notNull(),
}, (table) => [
	index("product_discount_discount_id_idx").using("btree", table.discountId.asc().nullsLast().op("text_ops")),
	index("product_discount_product_id_idx").using("btree", table.productId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [product.id],
			name: "product_discount_product_id_product_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.discountId],
			foreignColumns: [discount.id],
			name: "product_discount_discount_id_discount_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.productId, table.discountId], name: "product_discount_product_id_discount_id_pk"}),
]);

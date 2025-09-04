import { relations } from "drizzle-orm/relations";
import { user, account, restaurant, discount, discountUsage, category, session, discountQrScan, visitor, discountRedemption, discountView, interactionEvent, restaurantCost, restaurantVisit, product, productDiscount } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	discountUsages: many(discountUsage),
	sessions: many(session),
	discountQrScans: many(discountQrScan),
	visitors: many(visitor),
	discountRedemptions: many(discountRedemption),
	discountViews: many(discountView),
	interactionEvents: many(interactionEvent),
	restaurantVisits: many(restaurantVisit),
}));

export const discountRelations = relations(discount, ({one, many}) => ({
	restaurant: one(restaurant, {
		fields: [discount.restaurantId],
		references: [restaurant.id]
	}),
	discountUsages: many(discountUsage),
	discountQrScans: many(discountQrScan),
	discountRedemptions: many(discountRedemption),
	discountViews: many(discountView),
	productDiscounts: many(productDiscount),
}));

export const restaurantRelations = relations(restaurant, ({many}) => ({
	discounts: many(discount),
	categories: many(category),
	discountRedemptions: many(discountRedemption),
	discountViews: many(discountView),
	interactionEvents: many(interactionEvent),
	restaurantCosts: many(restaurantCost),
	restaurantVisits: many(restaurantVisit),
	products: many(product),
}));

export const discountUsageRelations = relations(discountUsage, ({one}) => ({
	discount: one(discount, {
		fields: [discountUsage.discountId],
		references: [discount.id]
	}),
	user: one(user, {
		fields: [discountUsage.userId],
		references: [user.id]
	}),
}));

export const categoryRelations = relations(category, ({one, many}) => ({
	restaurant: one(restaurant, {
		fields: [category.restaurantId],
		references: [restaurant.id]
	}),
	products: many(product),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const discountQrScanRelations = relations(discountQrScan, ({one}) => ({
	discount: one(discount, {
		fields: [discountQrScan.discountId],
		references: [discount.id]
	}),
	user: one(user, {
		fields: [discountQrScan.userId],
		references: [user.id]
	}),
	visitor: one(visitor, {
		fields: [discountQrScan.visitorId],
		references: [visitor.id]
	}),
}));

export const visitorRelations = relations(visitor, ({one, many}) => ({
	discountQrScans: many(discountQrScan),
	user: one(user, {
		fields: [visitor.userId],
		references: [user.id]
	}),
	discountRedemptions: many(discountRedemption),
	discountViews: many(discountView),
	interactionEvents: many(interactionEvent),
	restaurantVisits: many(restaurantVisit),
}));

export const discountRedemptionRelations = relations(discountRedemption, ({one}) => ({
	discount: one(discount, {
		fields: [discountRedemption.discountId],
		references: [discount.id]
	}),
	restaurant: one(restaurant, {
		fields: [discountRedemption.restaurantId],
		references: [restaurant.id]
	}),
	user: one(user, {
		fields: [discountRedemption.userId],
		references: [user.id]
	}),
	visitor: one(visitor, {
		fields: [discountRedemption.visitorId],
		references: [visitor.id]
	}),
}));

export const discountViewRelations = relations(discountView, ({one}) => ({
	discount: one(discount, {
		fields: [discountView.discountId],
		references: [discount.id]
	}),
	restaurant: one(restaurant, {
		fields: [discountView.restaurantId],
		references: [restaurant.id]
	}),
	user: one(user, {
		fields: [discountView.userId],
		references: [user.id]
	}),
	visitor: one(visitor, {
		fields: [discountView.visitorId],
		references: [visitor.id]
	}),
}));

export const interactionEventRelations = relations(interactionEvent, ({one}) => ({
	restaurant: one(restaurant, {
		fields: [interactionEvent.restaurantId],
		references: [restaurant.id]
	}),
	user: one(user, {
		fields: [interactionEvent.userId],
		references: [user.id]
	}),
	visitor: one(visitor, {
		fields: [interactionEvent.visitorId],
		references: [visitor.id]
	}),
}));

export const restaurantCostRelations = relations(restaurantCost, ({one}) => ({
	restaurant: one(restaurant, {
		fields: [restaurantCost.restaurantId],
		references: [restaurant.id]
	}),
}));

export const restaurantVisitRelations = relations(restaurantVisit, ({one}) => ({
	restaurant: one(restaurant, {
		fields: [restaurantVisit.restaurantId],
		references: [restaurant.id]
	}),
	user: one(user, {
		fields: [restaurantVisit.userId],
		references: [user.id]
	}),
	visitor: one(visitor, {
		fields: [restaurantVisit.visitorId],
		references: [visitor.id]
	}),
}));

export const productRelations = relations(product, ({one, many}) => ({
	category: one(category, {
		fields: [product.categoryId],
		references: [category.id]
	}),
	restaurant: one(restaurant, {
		fields: [product.restaurantId],
		references: [restaurant.id]
	}),
	productDiscounts: many(productDiscount),
}));

export const productDiscountRelations = relations(productDiscount, ({one}) => ({
	product: one(product, {
		fields: [productDiscount.productId],
		references: [product.id]
	}),
	discount: one(discount, {
		fields: [productDiscount.discountId],
		references: [discount.id]
	}),
}));
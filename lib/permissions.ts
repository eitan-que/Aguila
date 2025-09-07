import { createAccessControl } from "better-auth/plugins/access";

export type permission = typeof statement[keyof typeof statement][number];
export type userRole = typeof user.statements[keyof typeof user.statements][number];
export type adminRole = typeof admin.statements[keyof typeof admin.statements][number];
export type role = userRole | adminRole

export const statement = {
    user: [
        // Permiso especifico para leer cada aspecto del usuario
        "read:own:id",
        "read:own:name",
        "read:own:email",
        "read:own:image",
        "read:own:createdAt",
        "read:own:updatedAt",
        "read:own:role",
        "read:own:banned",
        "read:own:banReason",
        "read:own:banExpires",

        // Permiso especifico para leer cada aspecto de otros usuarios
        "read:other:id",
        "read:other:name",
        "read:other:email",
        "read:other:image",
        "read:other:createdAt",
        "read:other:updatedAt",
        "read:other:role",
        "read:other:banned",
        "read:other:banReason",
        "read:other:banExpires",

        // Permiso especifico para actualizar cada aspecto del usuario
        "update:own:name",
        "update:own:image",

        // Permiso especifico para actualizar cada aspecto de otros usuarios
        "update:other:name",
        "update:other:image",

        // Permiso especifico para banear a otros usuarios
        "ban:other",
        "unban:other",
    ],
    restaurant: [
        "read:restaurant:public",  // Public permission to view restaurant details
        "read:restaurant:private", // Private restaurant details (owner/admin only)
        "create:restaurant",       // Create new restaurant
        "update:restaurant:own",   // Update own restaurant
        "update:restaurant:any",   // Admin-only permission to update any restaurant
        "delete:restaurant:own",   // Delete own restaurant
        "delete:restaurant:any",   // Admin-only permission to delete any restaurant
    ],
    category: [
        "read:category:public",    // Public permission to view categories
        "create:category",         // Create new category
        "update:category:own",     // Update category in own restaurant
        "update:category:any",     // Admin-only permission to update any category
        "delete:category:own",     // Delete category from own restaurant
        "delete:category:any",     // Admin-only permission to delete any category
    ],
    discount: [
        "read:discount:public",    // Public permission to view discounts
        "create:discount",         // Create new discount
        "update:discount:own",     // Update discount in own restaurant
        "update:discount:any",     // Admin-only permission to update any discount
        "delete:discount:own",     // Delete discount from own restaurant
        "delete:discount:any",     // Admin-only permission to delete any discount
        "redeem:discount",         // Redeem a discount (customer permission)
        "generate:discount-qr",    // Generate QR code for discount
    ],
    analytics: [
        "read:analytics:own",      // View analytics for own restaurant
        "read:analytics:any",      // Admin permission to view any restaurant's analytics
        "read:analytics:platform", // Admin permission to view platform-wide analytics
        "write:analytics:event",    // Agregar permiso opcional para escritura de eventos (no requerido si se consideran públicos)
    ],
} as const;
 
export const ac = createAccessControl(statement);
 
export const user = ac.newRole({
    user: [
        "read:own:id",
        "read:own:name",
        "read:own:email",
        "read:own:image",
        "read:own:createdAt",
        "read:own:updatedAt",
        "read:own:role",
        "read:own:banned",
        "read:own:banReason",
        "read:own:banExpires",

        "update:own:name",
        "update:own:image",
    ],
    restaurant: [
        "read:restaurant:public",
    ],
    category: [
        "read:category:public",
    ],
    discount: [
        "read:discount:public",
        "redeem:discount",
    ]
}); 
 
export const restaurantOwner = ac.newRole({
    ...user.statements,
    
    restaurant: [
        "update:restaurant:own",
        "delete:restaurant:own",
    ],
    category: [
        "create:category",
        "update:category:own",
        "delete:category:own",
    ],
    discount: [
        "create:discount",
        "update:discount:own",
        "delete:discount:own",
        "generate:discount-qr",
    ],
});
 
export const admin = ac.newRole({
    ...restaurantOwner.statements,

    user: [
        "read:other:id",
        "read:other:name",
        "read:other:email",
        "read:other:image",
        "read:other:createdAt",
        "read:other:updatedAt",
        "read:other:role",
        "read:other:banned",
        "read:other:banReason",
        "read:other:banExpires",

        "update:other:name",
        "update:other:image",

        "ban:other",
        "unban:other",
    ],
    restaurant: [
        "create:restaurant",
        "read:restaurant:private",
        "update:restaurant:any",
        "delete:restaurant:any",
    ],
    category: [
        "update:category:any",
        "delete:category:any",
    ],
    discount: [
        "update:discount:any",
        "delete:discount:any",
    ],
    analytics: [
        "read:analytics:own",
        "read:analytics:any",
        "read:analytics:platform",
        "write:analytics:event",
    ]
});
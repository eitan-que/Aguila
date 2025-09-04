import { db } from '@/db/drizzle';
import { discount, discountUsage, productDiscount, restaurant, user, discountView, discountQrScan, discountRedemption, restaurantVisit, visitor, type WeekdayFlags } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, count, desc, eq, gte, gt, lte, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import type { Discount, Discount as DiscountRow } from '@/db/schema';

// Secret key for signing QR code tokens
const QR_SECRET: string = (() => {
  const v = process.env.QR_SECRET;
  if (!v) {
    throw new Error("QR_SECRET environment variable is not set");
  }
  return v;
})();

// Token payload type for discount QR codes
interface DiscountQRToken {
  type: 'discount';
  id: string;
  timestamp: number;
  nonce: string;
}

// ============================
// Discount Schema Validation
// ============================

const discountSchema = z.object({
  name: z.string().min(2, "Discount name must be at least 2 characters"),
  description: z.string().optional(),
  type: z.enum(["fixed", "percentage", "quantity"]),
  value: z.number().int().positive("Value must be a positive number"),
  buyQuantity: z.number().int().positive().optional(),
  getQuantity: z.number().int().positive().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  maxUses: z.number().int().nonnegative().optional(),
  maxUsesPerUser: z.number().int().nonnegative().optional(),
  requiresAuth: z.boolean().default(false),
  validDays: z.object({
    monday: z.boolean().default(true),
    tuesday: z.boolean().default(true),
    wednesday: z.boolean().default(true),
    thursday: z.boolean().default(true),
    friday: z.boolean().default(true),
    saturday: z.boolean().default(true),
    sunday: z.boolean().default(true),
  }).optional(),
  restaurantId: z.string().min(1, "Restaurant ID is required"),
  productIds: z.array(z.string()).optional(),
});

type DiscountFormData = z.infer<typeof discountSchema>;

// ============================
// QR Code Functions
// ============================

/**
 * Generate a QR code for a discount
 */
export async function generateDiscountQR(discountId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { error: "Authentication required" };
    }
    
    // Verify the discount exists
    const discountData = await db.query.discount.findFirst({
      where: eq(discount.id, discountId)
    });
    
    if (!discountData) {
      return { error: "Discount not found" };
    }
    
    // Check if user has permission
    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
          discount: ["generate:discount-qr"]
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to generate QR codes" };
    }
    
    // Create a unique token for this QR code instance
    const qrToken = {
      type: 'discount',
      id: discountId,
      timestamp: Date.now(),
      nonce: crypto.randomUUID().slice(0, 8) // Add randomness to make each QR unique
    };
    
    // Sign the token with a secret key
    const token = jwt.sign(qrToken, QR_SECRET, { expiresIn: '30d' });
    
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(token);
    
    return { 
      qrCode: qrDataUrl,
      token
    };
  } catch (error) {
    console.error("Failed to generate discount QR code:", error);
    return { error: "Failed to generate QR code" };
  }
}

/**
 * Verify and redeem a discount from QR code
 */
export async function redeemDiscountQR(token: string, visitorId?: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    let decoded = jwt.decode(token) as DiscountQRToken | null;
    if (!decoded || decoded.type !== 'discount' || !decoded.id) {
      // registrar scan fallido
      await db.insert(discountQrScan).values({
        id: crypto.randomUUID(),
        discountId: null,
        tokenNonce: decoded?.nonce ?? null,
        success: false,
        userId: session?.user?.id ?? null,
        visitorId: visitorId ?? null,
      });
      return { error: "Invalid discount QR code" };
    }

    // Buscar descuento
    const discountData = await db.query.discount.findFirst({
      where: eq(discount.id, decoded.id)
    });
    if (!discountData) {
      await db.insert(discountQrScan).values({
        id: crypto.randomUUID(),
        discountId: null,
        tokenNonce: decoded.nonce,
        success: false,
        userId: session?.user?.id ?? null,
        visitorId: visitorId ?? null,
      });
      return { error: "Discount not found" };
    }

    // Verificar firma
    try {
      jwt.verify(token, QR_SECRET);
    } catch {
      await db.insert(discountQrScan).values({
        id: crypto.randomUUID(),
        discountId: discountData.id,
        tokenNonce: decoded.nonce,
        success: false,
        userId: session?.user?.id ?? null,
        visitorId: visitorId ?? null,
      });
      return { error: "QR code has expired or is invalid" };
    }

    if (discountData.requiresAuth && !session?.user) {
      return { error: "Authentication required" };
    }

    const now = new Date();
    if (now < discountData.startDate || now > discountData.endDate) {
      return { error: "Discount not active" };
    }

    const validDays = discountData.validDays as WeekdayFlags;
    const dayKey = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][now.getDay()] as keyof WeekdayFlags;
    if (validDays && !validDays[dayKey]) {
      return { error: "Discount not valid today" };
    }

    if (discountData.maxUses && (discountData.currentUses ?? 0) >= discountData.maxUses) {
      return { error: "Max uses reached" };
    }

    if (session?.user && discountData.maxUsesPerUser) {
      const usage = await db.query.discountUsage.findFirst({
        where: and(
          eq(discountUsage.discountId, discountData.id),
          eq(discountUsage.userId, session.user.id)
        )
      });
      if (usage && usage.usageCount >= discountData.maxUsesPerUser) {
        return { error: "Per-user limit reached" };
      }
    }

    // Registrar scan exitoso
    await db.insert(discountQrScan).values({
      id: crypto.randomUUID(),
      discountId: discountData.id,
      tokenNonce: decoded.nonce,
      success: true,
      userId: session?.user?.id ?? null,
      visitorId: visitorId ?? null,
    });

    // Incrementar contador global
    await db.update(discount)
      .set({ currentUses: (discountData.currentUses ?? 0) + 1, updatedAt: new Date() })
      .where(eq(discount.id, discountData.id));

    // Registrar uso global
    await db.insert(discountRedemption).values({
      id: crypto.randomUUID(),
      discountId: discountData.id,
      restaurantId: discountData.restaurantId ?? null,
      userId: session?.user?.id ?? null,
      visitorId: visitorId ?? null,
    });

    // Per user
    if (session?.user) {
      const usage = await db.query.discountUsage.findFirst({
        where: and(eq(discountUsage.discountId, discountData.id), eq(discountUsage.userId, session.user.id))
      });
      if (usage) {
        await db.update(discountUsage)
          .set({ usageCount: usage.usageCount + 1, lastUsedAt: new Date() })
          .where(eq(discountUsage.id, usage.id));
      } else {
        await db.insert(discountUsage).values({
          id: crypto.randomUUID(),
            discountId: discountData.id,
            userId: session.user.id,
            usageCount: 1,
            lastUsedAt: new Date()
        });
      }
    }

    return {
      success: true,
      discount: {
        id: discountData.id,
        name: discountData.name,
        type: discountData.type,
        value: discountData.value,
        buyQuantity: discountData.buyQuantity,
        getQuantity: discountData.getQuantity,
      }
    };
  } catch (e) {
    return { error: "Failed to redeem discount" };
  }
}

// ============================
// Public Discount Actions
// ============================

/**
 * Get active discounts for a specific restaurant
 */
export async function getActiveDiscountsByRestaurant(restaurantId: string) {
  try {
    const now = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    
    const discounts = await db.query.discount.findMany({
      where: and(
        eq(discount.restaurantId, restaurantId),
        lte(discount.startDate, now),
        gte(discount.endDate, now),
        // For validDays, we would ideally check JSON field but it's more complex
        // This is a simplified version that doesn't filter by day
      ),
      orderBy: (discount) => [discount.name],
    });
    
    // Filter by valid day manually since it's a JSON field
    const filteredDiscounts = discounts.filter(d => {
      const validDays = d.validDays as any;
      return validDays && validDays[dayOfWeek];
    });
    
    return { discounts: filteredDiscounts };
  } catch (error) {
    console.error(`Failed to fetch active discounts for restaurant ${restaurantId}:`, error);
    return { error: "Failed to fetch discounts" };
  }
}

/**
 * Get active discounts for a specific product
 */
export async function getActiveDiscountsByProduct(productId: string) {
  try {
    const now = new Date();
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
    
    // Get discounts linked to this product
    const productDiscounts = await db.query.productDiscount.findMany({
      where: eq(productDiscount.productId, productId),
      with: {
        discount: true
      }
    });
    
    const activeDiscounts = productDiscounts
      .filter(pd => pd.discount)
      .map(pd => pd.discount)
      .filter((d: Discount) => {
        // Check date range
        const isActive = d.startDate <= now && d.endDate >= now;
        
        // Check valid day
        const validDays = d.validDays as WeekdayFlags | undefined;
        const isValidDay = validDays ? validDays[dayOfWeek as keyof WeekdayFlags] : false;
        
        return isActive && isValidDay;
      });
    
    return { discounts: activeDiscounts };
  } catch (error) {
    console.error(`Failed to fetch active discounts for product ${productId}:`, error);
    return { error: "Failed to fetch discounts" };
  }
}

/**
 * Get a single discount by ID
 */
export async function getDiscount(discountId: string) {
  try {
    const result = await db.query.discount.findFirst({
      where: eq(discount.id, discountId),
      with: {
        // Include products this discount applies to
        // Note: This would require defining the relationship in your Drizzle schema
        products: true
      }
    });
    
    // if (result) await recordDiscountView(result.id);
    
    return { discount: result };
  } catch (error) {
    console.error(`Failed to fetch discount ${discountId}:`, error);
    return { error: "Failed to fetch discount" };
  }
}

// ============================
// Restaurant Owner/Admin Actions
// ============================

/**
 * Create a new discount
 */
export async function createDiscount(formData: DiscountFormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { error: "Authentication required" };
    }
    
    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
          discount: ["create:discount"]
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to create discounts" };
    }
    
    // Validate form data
    const validatedData = discountSchema.parse(formData);
    
    // Additional validation for quantity type discounts
    if (validatedData.type === "quantity" && 
        (!validatedData.buyQuantity || !validatedData.getQuantity)) {
      return { error: "Quantity discounts require buyQuantity and getQuantity" };
    }
    
    // Check if the restaurant exists
    const restaurantExists = await db.query.restaurant.findFirst({
      where: eq(restaurant.id, validatedData.restaurantId),
    });
    
    if (!restaurantExists) {
      return { error: "Restaurant not found" };
    }
    
    // TODO: Check if user owns this restaurant (you'd need to add ownerId to restaurant schema)
    
    const newDiscount = await db.insert(discount).values({
      id: crypto.randomUUID(),
      name: validatedData.name,
      description: validatedData.description,
      type: validatedData.type,
      value: validatedData.value,
      buyQuantity: validatedData.buyQuantity,
      getQuantity: validatedData.getQuantity,
      startDate: validatedData.startDate,
      endDate: validatedData.endDate,
      maxUses: validatedData.maxUses,
      maxUsesPerUser: validatedData.maxUsesPerUser,
      currentUses: 0,
      requiresAuth: validatedData.requiresAuth,
      validDays: validatedData.validDays || {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: true,
      },
      restaurantId: validatedData.restaurantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    // If product IDs are provided, link them to this discount
    if (validatedData.productIds && validatedData.productIds.length > 0) {
      const productLinks = validatedData.productIds.map(pid => ({
        productId: pid,
        discountId: newDiscount[0].id
      }));
      
      await db.insert(productDiscount).values(productLinks);
    }
    
    revalidatePath(`/r/${validatedData.restaurantId}`);
    
    return { discount: newDiscount[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map(e => e.message).join(", ") };
    }
    console.error("Failed to create discount:", error);
    return { error: "Failed to create discount" };
  }
}

/**
 * Update an existing discount
 */
export async function updateDiscount(discountId: string, formData: DiscountFormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { error: "Authentication required" };
    }
    
    // Get the discount to check restaurant ownership
    const discountToUpdate = await db.query.discount.findFirst({
      where: eq(discount.id, discountId),
    });
    
    if (!discountToUpdate) {
      return { error: "Discount not found" };
    }
    
    // Check if user has permission (either owns the restaurant or is admin)
    const isOwnRestaurant = false; // Need to add ownerId to schema and check
    const permissionRequired = isOwnRestaurant ? 
      "update:discount:own" : 
      "update:discount:any";
    
    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
          discount: [permissionRequired]
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to update this discount" };
    }
    
    // Validate form data
    const validatedData = discountSchema.parse(formData);
    
    // Additional validation for quantity type discounts
    if (validatedData.type === "quantity" && 
        (!validatedData.buyQuantity || !validatedData.getQuantity)) {
      return { error: "Quantity discounts require buyQuantity and getQuantity" };
    }
    
    // If restaurant is changing, check if it exists
    if (validatedData.restaurantId !== discountToUpdate.restaurantId) {
      const restaurantExists = await db.query.restaurant.findFirst({
        where: eq(restaurant.id, validatedData.restaurantId),
      });
      
      if (!restaurantExists) {
        return { error: "Restaurant not found" };
      }
    }
    
    const updatedDiscount = await db.update(discount)
      .set({
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        value: validatedData.value,
        buyQuantity: validatedData.buyQuantity,
        getQuantity: validatedData.getQuantity,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
        maxUses: validatedData.maxUses,
        maxUsesPerUser: validatedData.maxUsesPerUser,
        requiresAuth: validatedData.requiresAuth,
        validDays: validatedData.validDays || discountToUpdate.validDays,
        restaurantId: validatedData.restaurantId,
        updatedAt: new Date(),
      })
      .where(eq(discount.id, discountId))
      .returning();
    
    // If product IDs are provided, update the product links
    if (validatedData.productIds) {
      // Remove existing links
      await db.delete(productDiscount).where(eq(productDiscount.discountId, discountId));
      
      // Add new links
      if (validatedData.productIds.length > 0) {
        const productLinks = validatedData.productIds.map(pid => ({
          productId: pid,
          discountId: discountId
        }));
        
        await db.insert(productDiscount).values(productLinks);
      }
    }
    
    revalidatePath(`/r/${validatedData.restaurantId}`);
    if (discountToUpdate.restaurantId !== validatedData.restaurantId) {
      revalidatePath(`/r/${discountToUpdate.restaurantId}`);
    }
    
    return { discount: updatedDiscount[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map(e => e.message).join(", ") };
    }
    console.error("Failed to update discount:", error);
    return { error: "Failed to update discount" };
  }
}

/**
 * Delete a discount
 */
export async function deleteDiscount(discountId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { error: "Authentication required" };
    }
    
    // Get the discount to check restaurant ownership
    const discountToDelete = await db.query.discount.findFirst({
      where: eq(discount.id, discountId),
    });
    
    if (!discountToDelete) {
      return { error: "Discount not found" };
    }
    
    // Check if user has permission (either owns the restaurant or is admin)
    const isOwnRestaurant = false; // Need to add ownerId to schema and check
    const permissionRequired = isOwnRestaurant ? 
      "delete:discount:own" : 
      "delete:discount:any";
    
    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
          discount: [permissionRequired]
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to delete this discount" };
    }
    
    // Remove all product links first (necessary due to foreign key constraints)
    await db.delete(productDiscount).where(eq(productDiscount.discountId, discountId));
    
    // Remove discount usage records
    await db.delete(discountUsage).where(eq(discountUsage.discountId, discountId));
    
    // Delete the discount
    await db.delete(discount).where(eq(discount.id, discountId));
    
    revalidatePath(`/r/${discountToDelete.restaurantId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete discount:", error);
    return { error: "Failed to delete discount" };
  }
}

/**
 * Get total active discounts count
 */
export async function getActiveDiscountsCount() {
  try {
    const now = new Date();
    
    const result = await db.select({ count: count() }).from(discount).where(
      and(
        lte(discount.startDate, now),
        gte(discount.endDate, now)
      )
    );
    
    return { count: result[0]?.count ?? 0 };
  } catch (error) {
    console.error("Failed to count active discounts:", error);
    return { error: "Failed to count active discounts" };
  }
}

/**
 * Get most popular discounts (most redeemed)
 */
export async function getMostRedeemedDiscounts(limit = 10) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return { error: "Authentication required" };
  const hasPermission = await auth.api.userHasPermission({
    body: { userId: session.user.id, permissions: { analytics: ["read:analytics:platform"] } }
  });
  if (!hasPermission) return { error: "Forbidden" };

  const rows = await db.select({
    id: discount.id,
    name: discount.name,
    currentUses: discount.currentUses,
  }).from(discount)
    .orderBy(desc(discount.currentUses))
    .limit(limit);

  return { discounts: rows };
}

// Simple helper to list discounts by restaurant (dashboard use)
export async function getDiscountsByRestaurant(restaurantId: string) {
  try {
    const rows = await db.query.discount.findMany({ where: eq(discount.restaurantId, restaurantId) });
    return { discounts: rows };
  } catch (e) {
    return { error: 'Failed to fetch discounts' };
  }
}

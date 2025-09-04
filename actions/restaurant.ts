import { db } from '@/db/drizzle';
import { restaurant } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, AnyColumn, asc, count, desc, eq, gte, sql, SQLWrapper } from 'drizzle-orm';
import { headers } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { recordRestaurantVisit } from '@/actions/analytics';
import type { Restaurant as RestaurantRow } from '@/db/schema';

// ============================
// Restaurant Schema Validation
// ============================

const restaurantSchema = z.object({
    name: z.string().min(2, "Restaurant name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
    description: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    website: z.string().url("Invalid website URL").optional(),
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;

// ============================
// Public Restaurant Actions
// ============================

/**
 * Get a list of all restaurants (public info only)
 */
export async function getRestaurants() {
  try {
    const restaurants = await db.query.restaurant.findMany({
      orderBy: (restaurant) => [asc(restaurant.name)],
    });
    
    return { restaurants };
  } catch (error) {
    console.error("Failed to fetch restaurants:", error);
    return { error: "Failed to fetch restaurants" };
  }
}

/**
 * Get a single restaurant by ID or slug (public info only)
 */
export async function getRestaurant(restaurantIdOrSlug: string) {
  try {
    const result = await db.query.restaurant.findFirst({
      where: (restaurant, { or }) => 
        or(
          eq(restaurant.id, restaurantIdOrSlug),
          eq(restaurant.slug, restaurantIdOrSlug.toLowerCase())
        ),
      with: {
        // Include categories with their products
        // Note: These would need to be defined in your Drizzle schema
        categories: {
          with: {
            products: true
          },
          orderBy: (category: { updatedAt: SQLWrapper | AnyColumn; }) => [desc(category.updatedAt)]
        }
      }
    });

    // Log analytics for restaurant view
    if (result) {
      await recordRestaurantVisit(result.id);
    }

    return { restaurant: result };
  } catch (error) {
    console.error(`Failed to fetch restaurant ${restaurantIdOrSlug}:`, error);
    return { error: `Failed to fetch restaurant` };
  }
}

/**
 * Get restaurants sorted by popularity (visits)
 */
export async function getPopularRestaurants(limit = 10) {
  try {
    // This would ideally use analytics data to sort by actual visit count
    // For now, we're using a placeholder query
    const restaurants = await db.query.restaurant.findMany({
      orderBy: (restaurant) => [desc(restaurant.updatedAt)],
      limit
    });
    
    return { restaurants };
  } catch (error) {
    console.error("Failed to fetch popular restaurants:", error);
    return { error: "Failed to fetch popular restaurants" };
  }
}

// ============================
// Restaurant Owner Actions
// ============================

/**
 * Create a new restaurant
 */
export async function createRestaurant(formData: RestaurantFormData) {
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
            restaurant: ["create:restaurant"]
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to create restaurants" };
    }
    
    // Validate form data
    const validatedData = restaurantSchema.parse(formData);
    
    const newRestaurant = await db.insert(restaurant).values({
      id: crypto.randomUUID(),
      name: validatedData.name,
      slug: validatedData.slug,
      description: validatedData.description,
      address: validatedData.address,
      phone: validatedData.phone,
      email: validatedData.email,
      website: validatedData.website,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    revalidatePath("/");
    revalidatePath("/r");
    
    return { restaurant: newRestaurant[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map((e) => e.message).join(", ") };
    }
    console.error("Failed to create restaurant:", error);
    return { error: "Failed to create restaurant" };
  }
}

/**
 * Update an existing restaurant
 */
export async function updateRestaurant(restaurantId: string, formData: RestaurantFormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { error: "Authentication required" };
    }
    
    // Get the restaurant to check ownership
    const restaurantToUpdate = await db.query.restaurant.findFirst({
      where: eq(restaurant.id, restaurantId),
    });
    
    if (!restaurantToUpdate) {
      return { error: "Restaurant not found" };
    }
    
    // Check if user has permission (either own restaurant or admin)
    const isOwnRestaurant = false; // Need to add ownerId to schema and check
    const permissionRequired = isOwnRestaurant ? 
      "update:restaurant:own" : 
      "update:restaurant:any";
    
    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
            restaurant: [permissionRequired]
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to update this restaurant" };
    }
    
    // Validate form data
    const validatedData = restaurantSchema.parse(formData);
    
    const updatedRestaurant = await db.update(restaurant)
      .set({
        name: validatedData.name,
        description: validatedData.description,
        address: validatedData.address,
        phone: validatedData.phone,
        email: validatedData.email,
        website: validatedData.website,
        updatedAt: new Date(),
      })
      .where(eq(restaurant.id, restaurantId))
      .returning();
    
    revalidatePath(`/r/${restaurantId}`);
    
    return { restaurant: updatedRestaurant[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map((e) => e.message).join(", ") };
    }
    console.error("Failed to update restaurant:", error);
    return { error: "Failed to update restaurant" };
  }
}

/**
 * Delete a restaurant
 */
export async function deleteRestaurant(restaurantId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { error: "Authentication required" };
    }
    
    // Get the restaurant to check ownership
    const restaurantToDelete = await db.query.restaurant.findFirst({
      where: eq(restaurant.id, restaurantId),
    });
    
    if (!restaurantToDelete) {
      return { error: "Restaurant not found" };
    }
    
    // Check if user has permission (either own restaurant or admin)
    const isOwnRestaurant = false; // Need to add ownerId to schema and check
    const permissionRequired = isOwnRestaurant ? 
      "delete:restaurant:own" : 
      "delete:restaurant:any";
    
    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
          restaurant: [permissionRequired]
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to delete this restaurant" };
    }
    
    await db.delete(restaurant).where(eq(restaurant.id, restaurantId));
    
    revalidatePath("/");
    revalidatePath("/r");
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete restaurant:", error);
    return { error: "Failed to delete restaurant" };
  }
}

// ============================
// Analytics Functions
// ============================

/**
 * Get restaurant analytics for a specific restaurant
 * Available to restaurant owners and admins
 */
export async function getRestaurantAnalytics(restaurantId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { error: "Authentication required" };
    }
    
    // Check if user owns this restaurant or is admin
    const isOwnRestaurant = false; // Need to implement ownership check
    const permissionRequired = isOwnRestaurant ? 
      "read:analytics:own" : 
      "read:analytics:any";
    
    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
          analytics: [permissionRequired]
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to view these analytics" };
    }
    
    // In a real implementation, you would query your analytics tables
    // This is a placeholder
    return { 
      analytics: {
        visitsLastWeek: 123,
        visitsLastMonth: 548,
        mostVisitedDay: "Friday",
        promotionScans: 42,
        whatsappClicks: 15,
        locationClicks: 27,
        menuClicks: 89,
        categoryRank: 3,
        costPerVisit: 5.75,
        projectedVisits: {
          month1: 160,
          month2: 175,
          month3: 190
        }
      }
    };
  } catch (error) {
    console.error("Failed to fetch restaurant analytics:", error);
    return { error: "Failed to fetch restaurant analytics" };
  }
}

/**
 * Get total count of restaurants in the system
 */
export async function getTotalRestaurants() {
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
            analytics: ["read:analytics:platform"]
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to view platform analytics" };
    }
    
    const result = await db.select({ count: count() }).from(restaurant);
    return { count: result[0]?.count ?? 0 };
  } catch (error) {
    console.error("Failed to count restaurants:", error);
    return { error: "Failed to count restaurants" };
  }
}

/**
 * Get most and least visited restaurants in the last 30 days
 */
export async function getRestaurantVisitExtremes() {
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
          analytics: ["read:analytics:platform"]
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to view platform analytics" };
    }
    
    // In a real implementation, you would query your analytics tables
    // This is a placeholder
    return { 
      mostVisited: {
        id: "restaurant-1",
        name: "Popular Place",
        visits: 1245
      },
      leastVisited: {
        id: "restaurant-42",
        name: "Hidden Gem",
        visits: 17
      }
    };
  } catch (error) {
    console.error("Failed to fetch restaurant visit extremes:", error);
    return { error: "Failed to fetch restaurant visit data" };
  }
}
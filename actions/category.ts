import type { Category as CategoryRow } from '@/db/schema';
import { category, restaurant } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, asc, count, desc, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from '@/db/drizzle';

// ============================
// Category Schema Validation
// ============================

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
  restaurantId: z.string().min(1, "Restaurant ID is required"),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// ============================
// Public Category Actions
// ============================

/**
 * Get all categories for a specific restaurant
 */
export async function getCategoriesByRestaurant(restaurantId: string) {
  try {
    const categories = await db.query.category.findMany({
      where: eq(category.restaurantId, restaurantId),
      orderBy: (category) => [asc(category.name)],
    });
    
    return { categories };
  } catch (error) {
    console.error(`Failed to fetch categories for restaurant ${restaurantId}:`, error);
    return { error: "Failed to fetch categories" };
  }
}

/**
 * Get a single category by ID
 */
export async function getCategory(categoryId: string) {
  try {
    const result = await db.query.category.findFirst({
      where: eq(category.id, categoryId),
      with: {
        // Include products in this category
        // Note: This requires defining the relationship in your Drizzle schema
        products: true
      }
    });
    
    return { category: result };
  } catch (error) {
    console.error(`Failed to fetch category ${categoryId}:`, error);
    return { error: "Failed to fetch category" };
  }
}

// ============================
// Restaurant Owner/Admin Actions
// ============================

/**
 * Create a new category
 */
export async function createCategory(formData: CategoryFormData) {
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
            category: ["create:category"]
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to create categories" };
    }
    
    // Validate form data
    const validatedData = categorySchema.parse(formData);
    
    // Check if the restaurant exists
    const restaurantExists = await db.query.restaurant.findFirst({
      where: eq(restaurant.id, validatedData.restaurantId),
    });
    
    if (!restaurantExists) {
      return { error: "Restaurant not found" };
    }
    
    // TODO: Check if user owns this restaurant (you'd need to add ownerId to restaurant schema)
    
    const newCategory = await db.insert(category).values({
      id: crypto.randomUUID(),
      name: validatedData.name,
      description: validatedData.description,
      restaurantId: validatedData.restaurantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    revalidatePath(`/r/${validatedData.restaurantId}`);
    
    return { category: newCategory[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map(e => e.message).join(", ") };
    }
    console.error("Failed to create category:", error);
    return { error: "Failed to create category" };
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(categoryId: string, formData: CategoryFormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { error: "Authentication required" };
    }
    
    // Get the category to check restaurant ownership
    const categoryToUpdate = await db.query.category.findFirst({
      where: eq(category.id, categoryId),
    });
    
    if (!categoryToUpdate) {
      return { error: "Category not found" };
    }
    
    // Check if user has permission (either owns the restaurant or is admin)
    const isOwnRestaurant = false; // Need to add ownerId to schema and check
    const permissionRequired = isOwnRestaurant ? 
      "update:category:own" : 
      "update:category:any";
    
    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
          category: [permissionRequired]
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to update this category" };
    }
    
    // Validate form data
    const validatedData = categorySchema.parse(formData);
    
    // If restaurant ID is changing, check it exists
    if (validatedData.restaurantId !== categoryToUpdate.restaurantId) {
      const restaurantExists = await db.query.restaurant.findFirst({
        where: eq(restaurant.id, validatedData.restaurantId),
      });
      
      if (!restaurantExists) {
        return { error: "Restaurant not found" };
      }
    }
    
    const updatedCategory = await db.update(category)
      .set({
        name: validatedData.name,
        description: validatedData.description,
        restaurantId: validatedData.restaurantId,
        updatedAt: new Date(),
      })
      .where(eq(category.id, categoryId))
      .returning();
    
    revalidatePath(`/r/${validatedData.restaurantId}`);
    
    return { category: updatedCategory[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map(e => e.message).join(", ") };
    }
    console.error("Failed to update category:", error);
    return { error: "Failed to update category" };
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { error: "Authentication required" };
    }
    
    // Get the category to check restaurant ownership
    const categoryToDelete = await db.query.category.findFirst({
      where: eq(category.id, categoryId),
    });
    
    if (!categoryToDelete) {
      return { error: "Category not found" };
    }
    
    // Check if user has permission (either owns the restaurant or is admin)
    const isOwnRestaurant = false; // Need to add ownerId to schema and check
    const permissionRequired = isOwnRestaurant ? 
      "delete:category:own" : 
      "delete:category:any";
    
    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
            category: [permissionRequired]
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to delete this category" };
    }
    
    await db.delete(category).where(eq(category.id, categoryId));
    
    revalidatePath(`/r/${categoryToDelete.restaurantId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { error: "Failed to delete category" };
  }
}

// ============================
// Analytics Functions
// ============================

/**
 * Get total count of categories in the system
 */
export async function getTotalCategories() {
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
    
    const result = await db.select({ count: count() }).from(category);
    return { count: result[0]?.count ?? 0 };
  } catch (error) {
    console.error("Failed to count categories:", error);
    return { error: "Failed to count categories" };
  }
}

/**
 * Get most popular categories
 */
export async function getMostPopularCategories(limit = 10) {
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
    
    // In a real implementation, you would join with analytics tables
    // This is a placeholder query that just returns categories
    const categories = await db.query.category.findMany({
      limit
    });
    
    return { 
      categories: categories.map(cat => ({
        ...cat,
        // Add mock popularity data
        popularity: Math.floor(Math.random() * 100)
      })) 
    };
  } catch (error) {
    console.error("Failed to fetch popular categories:", error);
    return { error: "Failed to fetch popular categories" };
  }
}

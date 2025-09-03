import { db } from '@/db/drizzle';
import { product, category, restaurant } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, asc, count, desc, eq, inArray } from 'drizzle-orm';
import { headers } from 'next/headers';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { recordInteraction } from '@/actions/analytics';

// ============================
// Product Schema Validation
// ============================

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.number().int().positive("Price must be a positive number"),
  imageUrl: z.string().url("Invalid image URL").optional(),
  categoryId: z.string().optional(),
  restaurantId: z.string().min(1, "Restaurant ID is required"),
});

type ProductFormData = z.infer<typeof productSchema>;

// ============================
// Public Product Actions
// ============================

/**
 * Get all products for a specific restaurant
 */
export async function getProductsByRestaurant(restaurantId: string) {
  try {
    const products = await db.query.product.findMany({
      where: eq(product.restaurantId, restaurantId),
      orderBy: (product) => [asc(product.name)],
    });
    
    return { products };
  } catch (error) {
    console.error(`Failed to fetch products for restaurant ${restaurantId}:`, error);
    return { error: "Failed to fetch products" };
  }
}

/**
 * Get all products for a specific category
 */
export async function getProductsByCategory(categoryId: string) {
  try {
    const products = await db.query.product.findMany({
      where: eq(product.categoryId, categoryId),
      orderBy: (product) => [asc(product.name)],
    });
    
    return { products };
  } catch (error) {
    console.error(`Failed to fetch products for category ${categoryId}:`, error);
    return { error: "Failed to fetch products" };
  }
}

/**
 * Get a single product by ID
 */
export async function getProduct(productId: string) {
  try {
    const result = await db.query.product.findFirst({
      where: eq(product.id, productId),
      with: {
        // Include discounts available for this product
        // Note: This would require defining the relationship in your Drizzle schema
        discounts: true
      }
    });
    
    if (result) {
      await recordInteraction('menu_click', result.restaurantId ?? undefined);
    }
    
    return { product: result };
  } catch (error) {
    console.error(`Failed to fetch product ${productId}:`, error);
    return { error: "Failed to fetch product" };
  }
}

/**
 * Search products by name or description
 */
export async function searchProducts(query: string) {
  try {
    // This is a simplified search implementation
    // In a real app, you might use full-text search capabilities
    
    const searchResults = await db.query.product.findMany({
      where: (fields, { like, or }) => or(
        like(fields.name, `%${query}%`),
        like(fields.description || '', `%${query}%`)
      ),
      limit: 20,
    });
    
    return { products: searchResults };
  } catch (error) {
    console.error(`Failed to search products with query "${query}":`, error);
    return { error: "Failed to search products" };
  }
}

// ============================
// Restaurant Owner/Admin Actions
// ============================

/**
 * Create a new product
 */
export async function createProduct(formData: ProductFormData) {
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
            product: [
                "create:product",          // Create new product
            ],
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to create products" };
    }
    
    // Validate form data
    const validatedData = productSchema.parse(formData);
    
    // Check if the restaurant exists
    const restaurantExists = await db.query.restaurant.findFirst({
      where: eq(restaurant.id, validatedData.restaurantId),
    });
    
    if (!restaurantExists) {
      return { error: "Restaurant not found" };
    }
    
    // If category ID is provided, check if it exists and belongs to the restaurant
    if (validatedData.categoryId) {
      const categoryExists = await db.query.category.findFirst({
        where: and(
          eq(category.id, validatedData.categoryId),
          eq(category.restaurantId, validatedData.restaurantId)
        ),
      });
      
      if (!categoryExists) {
        return { error: "Category not found or doesn't belong to this restaurant" };
      }
    }
    
    // TODO: Check if user owns this restaurant (you'd need to add ownerId to restaurant schema)
    
    const newProduct = await db.insert(product).values({
      id: crypto.randomUUID(),
      name: validatedData.name,
      description: validatedData.description,
      price: validatedData.price,
      imageUrl: validatedData.imageUrl,
      categoryId: validatedData.categoryId,
      restaurantId: validatedData.restaurantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    
    revalidatePath(`/r/${validatedData.restaurantId}`);
    
    return { product: newProduct[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map(e => e.message).join(", ") };
    }
    console.error("Failed to create product:", error);
    return { error: "Failed to create product" };
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(productId: string, formData: ProductFormData) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { error: "Authentication required" };
    }
    
    // Get the product to check restaurant ownership
    const productToUpdate = await db.query.product.findFirst({
      where: eq(product.id, productId),
    });
    
    if (!productToUpdate) {
      return { error: "Product not found" };
    }
    
    // Check if user has permission (either owns the restaurant or is admin)
    const isOwnRestaurant = false; // Need to add ownerId to schema and check
    const permissionRequired = isOwnRestaurant ? 
      "update:product:own" : 
      "update:product:any";
    
    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
            product: [permissionRequired],
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to update this product" };
    }
    
    // Validate form data
    const validatedData = productSchema.parse(formData);
    
    // If restaurant ID is changing, check it exists
    if (validatedData.restaurantId !== productToUpdate.restaurantId) {
      const restaurantExists = await db.query.restaurant.findFirst({
        where: eq(restaurant.id, validatedData.restaurantId),
      });
      
      if (!restaurantExists) {
        return { error: "Restaurant not found" };
      }
    }
    
    // If category ID is provided, check if it exists and belongs to the restaurant
    if (validatedData.categoryId) {
      const categoryExists = await db.query.category.findFirst({
        where: and(
          eq(category.id, validatedData.categoryId),
          eq(category.restaurantId, validatedData.restaurantId)
        ),
      });
      
      if (!categoryExists) {
        return { error: "Category not found or doesn't belong to this restaurant" };
      }
    }
    
    const updatedProduct = await db.update(product)
      .set({
        name: validatedData.name,
        description: validatedData.description,
        price: validatedData.price,
        imageUrl: validatedData.imageUrl,
        categoryId: validatedData.categoryId,
        restaurantId: validatedData.restaurantId,
        updatedAt: new Date(),
      })
      .where(eq(product.id, productId))
      .returning();
    
    revalidatePath(`/r/${validatedData.restaurantId}`);
    if (productToUpdate.categoryId) {
      revalidatePath(`/c/${productToUpdate.categoryId}`);
    }
    revalidatePath(`/p/${productId}`);
    
    return { product: updatedProduct[0] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.issues.map(e => e.message).join(", ") };
    }
    console.error("Failed to update product:", error);
    return { error: "Failed to update product" };
  }
}

/**
 * Delete a product
 */
export async function deleteProduct(productId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { error: "Authentication required" };
    }
    
    // Get the product to check restaurant ownership
    const productToDelete = await db.query.product.findFirst({
      where: eq(product.id, productId),
    });
    
    if (!productToDelete) {
      return { error: "Product not found" };
    }
    
    // Check if user has permission (either owns the restaurant or is admin)
    const isOwnRestaurant = false; // Need to add ownerId to schema and check
    const permissionRequired = isOwnRestaurant ? 
      "delete:product:own" : 
      "delete:product:any";
    
    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
            product: [permissionRequired],
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to delete this product" };
    }
    
    await db.delete(product).where(eq(product.id, productId));
    
    revalidatePath(`/r/${productToDelete.restaurantId}`);
    if (productToDelete.categoryId) {
      revalidatePath(`/c/${productToDelete.categoryId}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { error: "Failed to delete product" };
  }
}

/**
 * Batch update product prices (e.g., for inflation adjustments)
 */
export async function batchUpdatePrices(restaurantId: string, productIds: string[], percentageIncrease: number) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return { error: "Authentication required" };
    }
    
    // Check if user has permission
    const isOwnRestaurant = false; // Need to add ownerId to schema and check
    const permissionRequired = isOwnRestaurant ? 
      "update:product:own" : 
      "update:product:any";
    
    const hasPermission = await auth.api.userHasPermission({
      body: {
        userId: session.user.id,
        permissions: {
            product: [permissionRequired]
        }
      }
    });

    if (!hasPermission) {
      return { error: "You don't have permission to update product prices" };
    }
    
    // Get all products that belong to this restaurant and are in the productIds list
    const productsToUpdate = await db.query.product.findMany({
      where: and(
        eq(product.restaurantId, restaurantId),
        inArray(product.id, productIds)
      ),
    });
    
    if (productsToUpdate.length === 0) {
      return { error: "No matching products found" };
    }
    
    // Update each product's price
    for (const p of productsToUpdate) {
      const newPrice = Math.round(p.price * (1 + percentageIncrease / 100));
      
      await db.update(product)
        .set({ 
          price: newPrice,
          updatedAt: new Date()
        })
        .where(eq(product.id, p.id));
    }
    
    revalidatePath(`/r/${restaurantId}`);
    
    return { 
      success: true, 
      updatedCount: productsToUpdate.length 
    };
  } catch (error) {
    console.error("Failed to batch update product prices:", error);
    return { error: "Failed to update product prices" };
  }
}

// ============================
// Analytics Functions
// ============================

/**
 * Get total count of products in the system
 */
export async function getTotalProducts() {
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
    
    const result = await db.select({ count: count() }).from(product);
    return { count: result[0]?.count ?? 0 };
  } catch (error) {
    console.error("Failed to count products:", error);
    return { error: "Failed to count products" };
  }
}

/**
 * Get most viewed products
 */
export async function getMostViewedProducts(limit = 10) {
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
    // This is a placeholder query that just returns products
    const products = await db.query.product.findMany({
      limit,
      orderBy: (product) => [desc(product.updatedAt)]
    });
    
    return { 
      products: products.map(prod => ({
        ...prod,
        // Add mock view data
        views: Math.floor(Math.random() * 10000)
      })) 
    };
  } catch (error) {
    console.error("Failed to fetch most viewed products:", error);
    return { error: "Failed to fetch most viewed products" };
  }
}
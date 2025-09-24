"use server"
import { db } from "@/db/drizzle"
import { category, restaurant, discount, restaurantCategory, discountCategory } from "@/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { eq, count, and, inArray, ne } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache"

export type CategoryWithStats = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  restaurantCount: number;
  discountCount: number;
}

export async function listCategories() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return { success: false, message: "Not authenticated", data: [] }
    }
    
    if (!session.user?.role || session.user.role !== "admin") {
      return { success: false, message: "Not authorized", data: [] }
    }

    // Get categories with counts
    const categories = await db.select().from(category);
    
    const categoriesWithStats: CategoryWithStats[] = await Promise.all(
      categories.map(async (cat) => {
        const [restaurantCount] = await db
          .select({ count: count() })
          .from(restaurantCategory)
          .where(eq(restaurantCategory.categoryId, cat.id));
          
        const [discountCount] = await db
          .select({ count: count() })
          .from(discountCategory)
          .where(eq(discountCategory.categoryId, cat.id));
        
        return {
          ...cat,
          restaurantCount: restaurantCount?.count || 0,
          discountCount: discountCount?.count || 0,
        };
      })
    );
    
    return { success: true, data: categoriesWithStats }
  } catch (err) {
    console.error("Fetch categories error:", err)
    return { success: false, message: "Internal Server Error", data: [] }
  }
}

export async function createCategory(data: { name: string; description?: string }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return { success: false, message: "Not authenticated" }
    }
    
    if (!session.user?.role || session.user.role !== "admin") {
      return { success: false, message: "Not authorized" }
    }

    // Validate data
    const schema = z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      description: z.string().optional(),
    });
    
    const validationResult = schema.safeParse(data);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || "Invalid data";
      return { success: false, message: errorMessage };
    }

    // Check if category with the same name already exists
    const existingCategory = await db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.name, data.name))
      .limit(1);

    if (existingCategory.length > 0) {
      return { success: false, message: "A category with this name already exists" };
    }

    // Create the category
    await db.insert(category).values({
      id: crypto.randomUUID(),
      name: data.name,
      description: data.description,
    });

    revalidatePath("/dashboard/c");
    revalidatePath("/");
    revalidatePath("/es");
    revalidatePath("/en");
    
    return { success: true };
  } catch (err) {
    console.error("Create category error:", err);
    return { success: false, message: "Internal Server Error" };
  }
}

export async function addRestaurantToCategory(restaurantId: string, categoryId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return { success: false, message: "Not authenticated" }
    }
    
    if (!session.user?.role || session.user.role !== "admin") {
      return { success: false, message: "Not authorized" }
    }
    
    // Check if restaurant exists
    const restaurantExists = await db
      .select({ id: restaurant.id })
      .from(restaurant)
      .where(eq(restaurant.id, restaurantId))
      .limit(1);
      
    if (restaurantExists.length === 0) {
      return { success: false, message: "Restaurant not found" };
    }
    
    // Check if category exists
    const categoryExists = await db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.id, categoryId))
      .limit(1);
      
    if (categoryExists.length === 0) {
      return { success: false, message: "Category not found" };
    }
    
    // Check if relationship already exists
    const relationshipExists = await db
      .select({ restaurantId: restaurantCategory.restaurantId })
      .from(restaurantCategory)
      .where(
        and(
          eq(restaurantCategory.restaurantId, restaurantId),
          eq(restaurantCategory.categoryId, categoryId)
        )
      )
      .limit(1);
      
    if (relationshipExists.length > 0) {
      return { success: false, message: "Restaurant is already in this category" };
    }
    
    // Add relationship
    await db.insert(restaurantCategory).values({
      restaurantId,
      categoryId,
    });
    
    revalidatePath("/dashboard/c");
    return { success: true };
  } catch (err) {
    console.error("Add restaurant to category error:", err);
    return { success: false, message: "Internal Server Error" };
  }
}

export async function addDiscountToCategories(discountId: string, categoryIds: string[]) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return { success: false, message: "Not authenticated" }
    }
    
    if (!session.user?.role || session.user.role !== "admin") {
      return { success: false, message: "Not authorized" }
    }
    
    // Remove existing relationships
    await db.delete(discountCategory).where(eq(discountCategory.discountId, discountId));
    
    // Add new relationships
    if (categoryIds.length > 0) {
      const values = categoryIds.map(categoryId => ({
        discountId,
        categoryId,
      }));
      
      await db.insert(discountCategory).values(values);
    }
    
    return { success: true }
  } catch (err) {
    console.error("Add discount to categories error:", err)
    return { success: false, message: "Internal Server Error" }
  }
}

export async function getRestaurantsByCategory(categoryId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return { success: false, message: "Not authenticated", data: [] }
    }
    
    if (!session.user?.role || session.user.role !== "admin") {
      return { success: false, message: "Not authorized", data: [] }
    }

    const restaurants = await db
      .select({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        pictureUrl: restaurant.pictureUrl,
        createdAt: restaurant.createdAt,
      })
      .from(restaurant)
      .innerJoin(restaurantCategory, eq(restaurant.id, restaurantCategory.restaurantId))
      .where(eq(restaurantCategory.categoryId, categoryId))
    
    return { success: true, data: restaurants }
  } catch (err) {
    console.error("Get restaurants by category error:", err)
    return { success: false, message: "Internal Server Error", data: [] }
  }
}

export async function getDiscountsByCategory(categoryId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return { success: false, message: "Not authenticated", data: [] }
    }
    
    if (!session.user?.role || session.user.role !== "admin") {
      return { success: false, message: "Not authorized" }
    }

    const discounts = await db
      .select({
        id: discount.id,
        name: discount.name,
        description: discount.description,
        imageUrl: discount.imageUrl,
        imageAlt: discount.imageAlt,
        restaurantId: discount.restaurantId,
      })
      .from(discount)
      .innerJoin(discountCategory, eq(discount.id, discountCategory.discountId))
      .where(eq(discountCategory.categoryId, categoryId))
    
    return { success: true, data: discounts }
  } catch (err) {
    console.error("Get discounts by category error:", err)
    return { success: false, message: "Internal Server Error", data: [] }
  }
}

export async function updateCategory(data: { id: string, name: string; description?: string }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return { success: false, message: "Not authenticated" }
    }
    
    if (!session.user?.role || session.user.role !== "admin") {
      return { success: false, message: "Not authorized" }
    }

    // Validate data
    const schema = z.object({
      id: z.string().min(1, "Category ID is required"),
      name: z.string().min(2, "Name must be at least 2 characters"),
      description: z.string().optional(),
    });
    
    const validationResult = schema.safeParse(data);
    if (!validationResult.success) {
      const errorMessage = validationResult.error.issues[0]?.message || "Invalid data";
      return { success: false, message: errorMessage };
    }

    // Check if category exists
    const existingCategory = await db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.id, data.id))
      .limit(1);

    if (existingCategory.length === 0) {
      return { success: false, message: "Category not found" };
    }

    // Check if another category with the same name already exists
    const nameExists = await db
      .select({ id: category.id })
      .from(category)
      .where(and(
        eq(category.name, data.name),
        ne(category.id, data.id)
      ))
      .limit(1);

    if (nameExists.length > 0) {
      return { success: false, message: "A category with this name already exists" };
    }

    // Update the category
    await db.update(category)
      .set({
        name: data.name,
        description: data.description,
        updatedAt: new Date()
      })
      .where(eq(category.id, data.id));
    revalidatePath("/dashboard/c");
    revalidatePath("/");
    revalidatePath("/es");
    revalidatePath("/en");
    return { success: true };
  } catch (err) {
    console.error("Update category error:", err);
    return { success: false, message: "Internal Server Error" };
  }
}

export type categoryData = {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export async function getCategoryById(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return { success: false, message: "Not authenticated" }
    }
    
    if (!session.user?.role || session.user.role !== "admin") {
      return { success: false, message: "Not authorized" }
    }

    const categoryData = await db.select().from(category).where(eq(category.id, id)).limit(1);
    
    if (categoryData.length === 0) {
      return { success: false, message: "Category not found", data: null };
    }
    
    return { success: true, data: categoryData[0] };
  } catch (err) {
    console.error("Get category by id error:", err);
    return { success: false, message: "Internal Server Error", data: null };
  }
}

export async function deleteCategory(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return { success: false, message: "Not authenticated" }
    }
    
    if (!session.user?.role || session.user.role !== "admin") {
      return { success: false, message: "Not authorized" }
    }

    // Check if category exists
    const existingCategory = await db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.id, id))
      .limit(1);

    if (existingCategory.length === 0) {
      return { success: false, message: "Category not found" };
    }

    // Delete related records in join tables first
    await db.delete(restaurantCategory).where(eq(restaurantCategory.categoryId, id));
    await db.delete(discountCategory).where(eq(discountCategory.categoryId, id));
    
    // Delete the category
    await db.delete(category).where(eq(category.id, id));

    return { success: true };
  } catch (err) {
    console.error("Delete category error:", err);
    return { success: false, message: "Internal Server Error" };
  }
}

export async function listRestaurantsWithoutCategory(categoryId?: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return { success: false, message: "Not authenticated", data: [] }
    }
    
    if (!session.user?.role || session.user.role !== "admin") {
      return { success: false, message: "Not authorized", data: [] }
    }
    
    // Find restaurants that are already in any category
    const restaurantsInCategories = await db
      .select({ id: restaurantCategory.restaurantId })
      .from(restaurantCategory);
    
    const restaurantIdsInCategories = restaurantsInCategories.map(r => r.id);
    
    // Get all restaurants not in any category
    const restaurants = await db
      .select({
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
      })
      .from(restaurant);
    
    // Filter out restaurants that are already in categories
    const availableRestaurants = restaurantIdsInCategories.length > 0 
      ? restaurants.filter(r => !restaurantIdsInCategories.includes(r.id))
      : restaurants;
    
    return { success: true, data: availableRestaurants }
  } catch (err) {
    console.error("List restaurants without category error:", err)
    return { success: false, message: "Internal Server Error", data: [] }
  }
}

export async function removeRestaurantFromCategory(restaurantId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return { success: false, message: "Not authenticated" }
    }
    
    if (!session.user?.role || session.user.role !== "admin") {
      return { success: false, message: "Not authorized" }
    }
    
    // Delete the relationship between restaurant and category
    await db.delete(restaurantCategory)
      .where(eq(restaurantCategory.restaurantId, restaurantId));
    
    revalidatePath("/dashboard/c");
    return { success: true };
  } catch (err) {
    console.error("Remove restaurant from category error:", err);
    return { success: false, message: "Internal Server Error" };
  }
}
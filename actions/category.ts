"use server"
import { db } from "@/db/drizzle"
import { category, restaurant } from "@/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { eq, count, isNull } from "drizzle-orm";
import { z } from "zod";

export type CategoryWithStats = {
  id: string;
  name: string;
  createdAt: Date;
  restaurantCount: number;
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

    // Get categories with restaurant count
    const categoriesWithCount = await db
      .select({
        id: category.id,
        name: category.name,
        createdAt: category.createdAt,
        restaurantCount: count(restaurant.id),
      })
      .from(category)
      .leftJoin(restaurant, eq(category.id, restaurant.categoryId))
      .groupBy(category.id, category.name, category.createdAt);
    
    return { success: true, data: categoriesWithCount as CategoryWithStats[] }
  } catch (err) {
    console.error("Fetch categories error:", err)
    return { success: false, message: "Internal Server Error", data: [] }
  }
}

export async function createCategory(data: { name: string }) {
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
    });

    return { success: true };
  } catch (err) {
    console.error("Create category error:", err);
    return { success: false, message: "Internal Server Error" };
  }
}

export async function deleteCategory(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    
    if (!session) {
      return { success: false, message: "Not authenticated" };
    }
    
    if (!session.user?.role || session.user.role !== "admin") {
      return { success: false, message: "Not authorized" };
    }

    // Check if category exists
    const categoryToDelete = await db
      .select()
      .from(category)
      .where(eq(category.id, id))
      .limit(1);
    
    if (categoryToDelete.length === 0) {
      return { success: false, message: "Category not found" };
    }

    // Delete the category (this will set restaurant.categoryId to null due to "set null" constraint)
    await db.delete(category).where(eq(category.id, id));
    
    return { success: true };
  } catch (err) {
    console.error("Delete category error:", err);
    return { success: false, message: "Internal Server Error" };
  }
}

export async function getCategoryById(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    
    if (!session) {
      return { success: false, message: "Not authenticated", data: null }
    }
    
    if (!session.user?.role || session.user.role !== "admin") {
      return { success: false, message: "Not authorized", data: null }
    }

    const categoryData = await db
      .select()
      .from(category)
      .where(eq(category.id, id))
      .limit(1)
    
    if (categoryData.length === 0) {
      return { success: false, message: "Category not found", data: null }
    }
    
    return { success: true, data: categoryData[0] }
  } catch (err) {
    console.error("Get category by ID error:", err)
    return { success: false, message: "Internal Server Error", data: null }
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
      .where(eq(restaurant.categoryId, categoryId))
    
    return { success: true, data: restaurants }
  } catch (err) {
    console.error("Get restaurants by category error:", err)
    return { success: false, message: "Internal Server Error", data: [] }
  }
}

export async function listRestaurantsWithoutCategory() {
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
      })
      .from(restaurant)
      .where(isNull(restaurant.categoryId))
    
    return { success: true, data: restaurants }
  } catch (err) {
    console.error("Get restaurants without category error:", err)
    return { success: false, message: "Internal Server Error", data: [] }
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
      .limit(1)
      
    if (restaurantExists.length === 0) {
      return { success: false, message: "Restaurant not found" }
    }
    
    // Check if category exists
    const categoryExists = await db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.id, categoryId))
      .limit(1)
      
    if (categoryExists.length === 0) {
      return { success: false, message: "Category not found" }
    }
    
    // Update the restaurant's category
    await db
      .update(restaurant)
      .set({ categoryId })
      .where(eq(restaurant.id, restaurantId))
    
    return { success: true }
  } catch (err) {
    console.error("Add restaurant to category error:", err)
    return { success: false, message: "Internal Server Error" }
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
    
    // Check if restaurant exists
    const restaurantExists = await db
      .select({ id: restaurant.id })
      .from(restaurant)
      .where(eq(restaurant.id, restaurantId))
      .limit(1)
      
    if (restaurantExists.length === 0) {
      return { success: false, message: "Restaurant not found" }
    }
    
    // Update the restaurant to remove category
    await db
      .update(restaurant)
      .set({ categoryId: null })
      .where(eq(restaurant.id, restaurantId))
    
    return { success: true }
  } catch (err) {
    console.error("Remove restaurant from category error:", err)
    return { success: false, message: "Internal Server Error" }
  }
}
"use server"
import { db } from "@/db/drizzle"
import { category, restaurant } from "@/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { eq, count } from "drizzle-orm";
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
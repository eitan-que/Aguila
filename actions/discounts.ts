"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { discount, discountCategory, restaurant } from "@/db/schema";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/db/drizzle";
import { put, del } from "@vercel/blob";
import { eq, sql, inArray, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type Discount = {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    imageAlt: string | null;
    restaurantId: string | null;
    restaurantSlug?: string | null; // nuevo
}

const mockedDiscounts: Discount[] = [
    {
        id: "1",
        name: "Summer Special",
        description: "Get 20% off on all orders above $50",
        imageUrl: "https://placehold.co/600x400/png",
        imageAlt: "Summer Special Discount",
        restaurantId: "rest1",
        restaurantSlug: "rest1" // mock
    },
    {
        id: "2",
        name: "Winter Wonderland",
        description: "Get 30% off on all orders above $100",
        imageUrl: "https://placehold.co/600x400/png",
        imageAlt: "Winter Wonderland Discount",
        restaurantId: "rest2",
        restaurantSlug: "rest2" // mock
    }
];

function uploadFileToBlob(restaurantName: string, discountName: string, file?: File | null): Promise<string> {
    return new Promise(async (resolve, reject) => {
        if (file === null || file === undefined || file.size === 0) {
            return reject({ success: false, message: "No image provided" });
        }
        if (file.size > 5 * 1024 * 1024) {
            return reject({ success: false, message: "Image size must be less than 5MB" })
        }
        const discountSlug = discountName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
        try {
            const fileName = `${crypto.randomUUID()}_${encodeURIComponent(restaurantName)}_${encodeURIComponent(discountSlug)}`;
            const blob = await put(
                `restaurants/discounts/${fileName}`,
                file,
                { access: 'public' }
            );
            resolve(blob.url);
        } catch (error) {
            reject(error);
        }
    });
}

export async function listDiscounts(restaurantId: string): Promise<{ success: boolean; message?: string; data?: Discount[] }> {
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

        // Query the database for discounts
        const results = await db.select().from(discount).where(eq(discount.restaurantId, restaurantId));

        // Map results to Discount type, adding restaurantSlug as null (or fetch if available)
        const discounts: Discount[] = results.map((d: any) => ({
            ...d,
            restaurantSlug: null // or fetch/compute the slug if you have it
        }));
        
        return { success: true, data: discounts };
    } catch (error) {
        console.error("Error listing discounts:", error);
        return { success: false, message: "Failed to fetch discounts" }
    }
}

type CreateDiscountParams = {
    name: string;
    description: string;
    image: File;
    imageAlt: string;
    restaurantId: string;
}

export async function createDiscount(data: CreateDiscountParams): Promise<{ success: boolean; message?: string; data?: Discount }> {
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

        const { name, description, image, imageAlt, restaurantId } = data;

        const imageUrl = await uploadFileToBlob(restaurantId, name, image);
        if (!imageUrl) {
            return { success: false, message: "Error uploading restaurant image" }
        }
        const id = crypto.randomUUID();
        // Save discount to database
        try {
            // Example implementation with drizzle
            await db.insert(discount).values({
                id,
                name,
                description,
                imageUrl,
                imageAlt,
                restaurantId,
            });
            
            // For now, return a mock response until the DB operation is fully implemented
            const newDiscount: Discount = {
                id,
                name,
                description,
                imageUrl,
                imageAlt,
                restaurantId
            };
            revalidatePath(`/dashboard/r/${restaurantId}`);
            revalidatePath("/");
            revalidatePath("/es");
            revalidatePath("/en");
            return { 
                success: true, 
                message: "Discount created successfully", 
                data: newDiscount 
            };
        } catch (error) {
            console.error("Error inserting discount into database:", error);
            return { success: false, message: "Failed to save discount to database" };
        }
    } catch (error) {
        console.error("Error creating discount:", error);
        return { success: false, message: "An unexpected error occurred" };
    }
}

export async function deleteDiscount(id: string): Promise<{ success: boolean; message?: string }> {
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

    // Get discount info before deletion for image cleanup
    const discountToDelete = await db.select().from(discount).where(eq(discount.id, id)).limit(1);
    
    if (discountToDelete.length === 0) {
      return { success: false, message: "Discount not found" };
    }
    
    // Delete from database
    await db.delete(discount).where(eq(discount.id, id));
    
    // Clean up image if it exists
    if (discountToDelete[0].imageUrl) {
      await del(discountToDelete[0].imageUrl);
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting discount:", error);
    return { success: false, message: "An error occurred while deleting the discount" };
  }
}

// Devuelve 3 descuentos aleatorios, opcionalmente filtrados por restaurantId
export async function getRandomDiscounts(params?: { 
  restaurantId?: string; 
  limit?: number; 
  categoryIds?: string[] 
}): Promise<{ success: boolean; data: Discount[]; message?: string }> {
  const limit = params?.limit ?? 3;
  const restaurantId = params?.restaurantId;
  const categoryIds = params?.categoryIds;

  try {
    const baseSelect = {
      id: discount.id,
      name: discount.name,
      description: discount.description,
      imageUrl: discount.imageUrl,
      imageAlt: discount.imageAlt,
      restaurantId: discount.restaurantId,
      restaurantSlug: restaurant.slug,
    };

    // Apply filters
    const conditions = [];
    
    if (restaurantId) {
      conditions.push(eq(discount.restaurantId, restaurantId));
    }
    
    let query;
    
    if (categoryIds && categoryIds.length > 0) {
      // Join with discountCategory to filter by categories
      query = db
        .select(baseSelect)
        .from(discount)
        .leftJoin(restaurant, eq(restaurant.id, discount.restaurantId))
        .innerJoin(discountCategory, eq(discount.id, discountCategory.discountId));
      conditions.push(inArray(discountCategory.categoryId, categoryIds));
    } else {
      query = db
        .select(baseSelect)
        .from(discount)
        .leftJoin(restaurant, eq(restaurant.id, discount.restaurantId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const rows = await query.orderBy(sql`random()`).limit(limit);

    if (!rows || rows.length === 0) {
      const pool = restaurantId
        ? mockedDiscounts.filter((d) => d.restaurantId === restaurantId)
        : mockedDiscounts;

      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, limit);
      return { success: true, data: shuffled };
    }

    return { success: true, data: rows as unknown as Discount[] };
  } catch (error) {
    console.error("Error fetching random discounts:", error);
    const pool = restaurantId
      ? mockedDiscounts.filter((d) => d.restaurantId === restaurantId)
      : mockedDiscounts;

    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, limit);
    return { success: true, data: shuffled, message: "Using fallback discounts" };
  }
}

type UpdateDiscountParams = {
    id: string;
    name: string;
    description: string;
    image?: File; // Optional as we might not always update the image
    imageAlt: string;
    restaurantId: string;
}

export async function updateDiscount(data: UpdateDiscountParams): Promise<{ success: boolean; message?: string; data?: Discount }> {
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

    const { id, name, description, image, imageAlt, restaurantId } = data;

    // Check if discount exists
    const discountToUpdate = await db.select().from(discount).where(eq(discount.id, id)).limit(1);
    if (discountToUpdate.length === 0) {
      return { success: false, message: "Discount not found" };
    }

    // Prepare update data
    const updateData: {
      name: string;
      description: string | null;
      imageUrl?: string | null;
      imageAlt?: string | null;
    } = {
      name,
      description,
      imageAlt
    };

    // Handle image upload if provided
    if (image) {
      const oldImageUrl = discountToUpdate[0].imageUrl;
      
      const imageUrl = await uploadFileToBlob(restaurantId, name, image);
      if (!imageUrl) {
        return { success: false, message: "Error uploading discount image" };
      }
      
      updateData.imageUrl = imageUrl;
      
      // Delete old image if it exists
      if (oldImageUrl) {
        await del(oldImageUrl);
      }
    }
    
    // Update discount in database
    await db.update(discount)
      .set(updateData)
      .where(eq(discount.id, id));
    
    // Get the updated discount to return it
    const updatedDiscount = await db.select().from(discount).where(eq(discount.id, id)).limit(1);
    
    return { 
      success: true, 
      message: "Discount updated successfully", 
      data: updatedDiscount[0] as Discount 
    };
  } catch (error) {
    console.error("Error updating discount:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function getDiscountById(id: string): Promise<{ success: boolean; message?: string; data?: Discount }> {
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

    const discountData = await db.select().from(discount).where(eq(discount.id, id)).limit(1);
    
    if (discountData.length === 0) {
      return { success: false, message: "Discount not found" };
    }
    
    return { 
      success: true, 
      data: discountData[0] as Discount 
    };
  } catch (error) {
    console.error("Error getting discount by ID:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
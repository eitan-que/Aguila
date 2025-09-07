"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { discount } from "@/db/schema";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/db/drizzle";
import { put } from "@vercel/blob";

type Discount = {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    imageAlt: string | null;
    restaurantId: string | null;
}

const mockedDiscounts: Discount[] = [
    {
        id: "1",
        name: "Summer Special",
        description: "Get 20% off on all orders above $50",
        imageUrl: "https://placehold.co/600x400/png",
        imageAlt: "Summer Special Discount",
        restaurantId: "rest1"
    },
    {
        id: "2",
        name: "Winter Wonderland",
        description: "Get 30% off on all orders above $100",
        imageUrl: "https://placehold.co/600x400/png",
        imageAlt: "Winter Wonderland Discount",
        restaurantId: "rest2"
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

        // In a real implementation, you would query the database for discounts
        // Example: const results = await db.select().from(discount).where(eq(discount.restaurantId, restaurantId))
        
        return { success: true, data: mockedDiscounts };
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
                restaurantId,
            };
            
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
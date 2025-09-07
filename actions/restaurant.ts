"use server"
import { db } from "@/db/drizzle"
import { restaurant } from "@/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { eq } from "drizzle-orm";
import { put } from "@vercel/blob";

type CreateRestaurantParsed = {
    name: string
    slug: string
    description?: string
    address?: string
    lat?: number
    lon?: number
    website?: string
    phone?: string
    email?: string
    prepTimeMin?: number
    prepTimeMax?: number
    picture?: File | null
    pictureAlt?: string
    tags?: string[]
}

function isValidEmail(s?: string) {
  return !s || /\S+@\S+\.\S+/.test(s)
}
function isValidUrl(s?: string) {
  return !s || /^https?:\/\/.+\..+/.test(s)
}

function uploadFileToBlob(restaurantName: string, file?: File | null): Promise<string> {
    return new Promise(async (resolve, reject) => {
        if (file === null || file === undefined || file.size === 0) {
            return reject({ success: false, message: "No image provided" });
        }
        if (file.size > 5 * 1024 * 1024) {
            return reject({ success: false, message: "Image size must be less than 5MB" })
        }
        try {
            const fileName = `${crypto.randomUUID()}_${encodeURIComponent(restaurantName)}`;
            const blob = await put(
                `restaurants/${fileName}`,
                file,
                { access: 'public' }
            );
            resolve(blob.url);
        } catch (error) {
            reject(error);
        }
    });
}

export async function CreateRestaurant(data: CreateRestaurantParsed) {

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

        // Validaciones
        if (!data.name || data.name.length < 3) {
            return { success: false, message: "Name must be at least 3 characters" }
        }
        if (!data.slug || data.slug.length < 3) {
            return { success: false, message: "Slug must be at least 3 characters" }
        }
        if (data.description && data.description.length > 300) {
            return { success: false, message: "Description must be at most 300 characters" }
        }
        if (data.address && data.address.length > 300) {
            return { success: false, message: "Address must be at most 300 characters" }
        }
        if (data.lat != null && (data.lat < -90 || data.lat > 90)) {
            return { success: false, message: "Latitude must be between -90 and 90" }
        }
        if (data.lon != null && (data.lon < -180 || data.lon > 180)) {
            return { success: false, message: "Longitude must be between -180 and 180" }
        }
        if (data.phone && data.phone.length < 7) {
            return { success: false, message: "Phone number must be at least 7 characters" }
        }
        if (!isValidEmail(data.email)) {
            return { success: false, message: "Email is not valid" }
        }
        if (data.prepTimeMin != null && data.prepTimeMin < 0) {
            return { success: false, message: "Minimum preparation time must be at least 0" }
        }
        if (data.prepTimeMax != null && data.prepTimeMax < 0) {
            return { success: false, message: "Maximum preparation time must be at least 0" }
        }
        if (data.prepTimeMin != null && data.prepTimeMax != null && data.prepTimeMin > data.prepTimeMax) {
            return { success: false, message: "Minimum preparation time must be less than maximum preparation time" }
        }
        if (!isValidUrl(data.website)) {
            return { success: false, message: "Website is not valid" }
        }
        if (data.picture && data.picture.size > 5 * 1024 * 1024) {
            return { success: false, message: "Picture size must be less than 5MB" }
        }
        if (data.pictureAlt && data.pictureAlt.length > 300) {
            return { success: false, message: "Picture alt text must be at most 300 characters" }
        }
        if (data.tags && data.tags.length > 5) {
            return { success: false, message: "You can only add up to 5 tags" }
        }
        // Slug único
        const existing = await db.select().from(restaurant).where(eq(restaurant.slug, data.slug))
        if (existing.length > 0) {
            return { success: false, message: "Slug already exists. Please choose another one." }
        }

        const pictureUrl = await uploadFileToBlob(data.slug, data.picture);
        if (!pictureUrl) {
            return { success: false, message: "Error uploading image" }
        }

        await db.insert(restaurant).values({
            id: crypto.randomUUID(),
            name: data.name,
            slug: data.slug,
            description: data.description ?? undefined,
            address: data.address ?? undefined,
            pictureUrl: pictureUrl ?? undefined,
            pictureAlt: data.pictureAlt ?? undefined,
            prepTimeMin: data.prepTimeMin ?? undefined,
            prepTimeMax: data.prepTimeMax ?? undefined,
            lat: data.lat != null ? data.lat.toString() : undefined,
            lon: data.lon != null ? data.lon.toString() : undefined,
            phone: data.phone ?? undefined,
            email: data.email ?? undefined,
            website: data.website ?? undefined,
            tags: data.tags ?? undefined,
        })

        return { success: true }
    } catch (err) {
        console.error("Create restaurant error:", err)
        return { success: false, message: "Internal Server Error" }
    }
}
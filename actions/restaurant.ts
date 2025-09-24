"use server"
import { db } from "@/db/drizzle"
import { restaurant } from "@/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { eq } from "drizzle-orm";
import { del, put } from "@vercel/blob";
import { revalidatePath } from "next/cache"

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
    menuPictures?: File[] | null
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
                `restaurants/banners/${fileName}`,
                file,
                { access: 'public' }
            );
            resolve(blob.url);
        } catch (error) {
            reject(error);
        }
    });
}

// Add this function to handle multiple file uploads
async function uploadMenuFilesToBlob(restaurantSlug: string, files?: File[] | null): Promise<string[]> {
    if (!files || files.length === 0) {
        return [];
    }
    
    const uploadPromises = files.map(async (file, index) => {
        if (file.size === 0) return "";
        if (file.size > 5 * 1024 * 1024) {
            throw new Error("Image size must be less than 5MB");
        }
        
        try {
            const fileName = `${crypto.randomUUID()}_${encodeURIComponent(restaurantSlug)}_menu_${index}`;
            const blob = await put(
                `restaurants/menus/${fileName}`, // Store in menus subdirectory
                file,
                { access: 'public' }
            );
            return blob.url;
        } catch (error) {
            console.error("Menu image upload error:", error);
            throw error;
        }
    });
    
    return Promise.all(uploadPromises);
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

        // Upload restaurant picture
        const pictureUrl = await uploadFileToBlob(data.slug, data.picture);
        if (!pictureUrl) {
            return { success: false, message: "Error uploading restaurant image" }
        }
        
        // Upload menu pictures
        let menuPictureUrls: string[] = [];
        if (data.menuPictures && data.menuPictures.length > 0) {
            try {
                menuPictureUrls = await uploadMenuFilesToBlob(data.slug, data.menuPictures);
            } catch (error) {
                return { success: false, message: "Error uploading menu images: " + (error as Error).message }
            }
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
            menuPictureUrl: menuPictureUrls.length > 0 ? menuPictureUrls : undefined, // Save menu picture URLs
        })

        revalidatePath("/dashboard/r");
        revalidatePath("/");
        revalidatePath("/es");
        revalidatePath("/en");
        revalidatePath("/es/r");
        revalidatePath("/en/r");
        
        return { success: true }
    } catch (err) {
        console.error("Create restaurant error:", err)
        return { success: false, message: "Internal Server Error" }
    }
}

export type RestaurantWithStats = {
  id: string
  name: string
  slug: string
  description?: string
  address?: string
  pictureUrl?: string
  createdAt: Date
  weeklyVisits: number
}

export async function listRestaurants() {
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

    const restaurants = await db.select({
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description,
      address: restaurant.address,
      pictureUrl: restaurant.pictureUrl,
      createdAt: restaurant.createdAt,
    }).from(restaurant)
    
    // Add mock weekly visits data
    const restaurantsWithStats: RestaurantWithStats[] = restaurants.map(r => ({
      ...r,
      description: r.description ?? undefined,
      address: r.address ?? undefined,
      pictureUrl: r.pictureUrl ?? undefined,
      weeklyVisits: Math.floor(Math.random() * 1000) // Mock data
    }))
    
    return { success: true, data: restaurantsWithStats }
  } catch (err) {
    console.error("Fetch restaurants error:", err)
    return { success: false, message: "Internal Server Error", data: [] }
  }
}

export async function deleteRestaurant(id: string) {
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
    const restaurantToDelete = await db.select().from(restaurant).where(eq(restaurant.id, id)).limit(1)
    if (restaurantToDelete.length === 0) {
      return { success: false, message: "Restaurant not found" }
    }
    await db.delete(restaurant).where(eq(restaurant.id, id))
    await del(restaurantToDelete[0].pictureUrl || "")
    
    return { success: true }
  } catch (err) {
    console.error("Delete restaurant error:", err)
    return { success: false, message: "Internal Server Error" }
  }
}

export async function getRestaurantBySlug(slug: string) {
  try {
    const restaurantData = await db.select().from(restaurant).where(eq(restaurant.slug, slug)).limit(1)
    if (restaurantData.length === 0) {
      return { success: false, message: "Restaurant not found", data: null }
    }
    return { success: true, data: restaurantData[0] }
  } catch (err) {
    console.error("Get restaurant by slug error:", err)
    return { success: false, message: "Internal Server Error", data: null }
  }
}

export async function getMenuRestaurants() {
  try {
    // Coordenadas fijas del usuario
    const USER_LAT = -34.55024194829162;
    const USER_LON = -58.454143897411136;

    // Haversine para distancia en km
    function toRad(v: number) { return (v * Math.PI) / 180; }
    function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 6371; // km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    // Selección mínima necesaria
    const rows = await db.select({
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      pictureUrl: restaurant.pictureUrl,
      pictureAlt: restaurant.pictureAlt,
      prepTimeMin: restaurant.prepTimeMin,
      prepTimeMax: restaurant.prepTimeMax,
      lat: restaurant.lat,
      lon: restaurant.lon,
      address: restaurant.address,
      tags: restaurant.tags,
    }).from(restaurant);

    const data = rows.map(r => {
      const lat = r.lat != null ? parseFloat(r.lat as unknown as string) : undefined;
      const lon = r.lon != null ? parseFloat(r.lon as unknown as string) : undefined;

      const hasCoords = typeof lat === "number" && !Number.isNaN(lat) && typeof lon === "number" && !Number.isNaN(lon);
      const dist = hasCoords ? distanceKm(USER_LAT, USER_LON, lat!, lon!) : undefined;

      // Peso aleatorio para que el componente, que ordena por weight, produzca orden aleatorio
      const weight = Math.floor(Math.random() * 1000);

      const tags = Array.isArray(r.tags)
        ? (r.tags as unknown as string[]).slice(0, 5).map(t => ({ type: "text" as const, text: t }))
        : undefined;

      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        picture: {
          src: r.pictureUrl || "https://placehold.co/1690x840/png",
          alt: r.pictureAlt || r.name,
        },
        // Mantenemos prepTimeRange por compatibilidad si en algún otro lugar se usa
        prepTimeRange: r.prepTimeMin != null && r.prepTimeMax != null
          ? { min: r.prepTimeMin, max: r.prepTimeMax }
          : undefined,
        highestPercentageDiscount: undefined,
        weight,
        categories: undefined,
        tags,
        address: r.address ?? undefined,
        coordinates: hasCoords ? { lat: lat!, lon: lon! } : undefined,
        distanceKm: dist, // distancia calculada
      };
    });

    return { success: true, data };
  } catch (err) {
    console.error("Get menu restaurants error:", err);
    return { success: false, message: "Internal Server Error", data: [] as any[] };
  }
}

type UpdateRestaurantParsed = {
    id: string
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
    menuPictures?: File[] | null
    removedMenuPictures?: string[] // URLs of menu pictures to remove
}

export async function UpdateRestaurant(data: UpdateRestaurantParsed) {
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
        const existingRestaurant = await db.select().from(restaurant).where(eq(restaurant.id, data.id)).limit(1)
        if (existingRestaurant.length === 0) {
            return { success: false, message: "Restaurant not found" }
        }
        
        // Validations - similar to CreateRestaurant
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
        
        // Slug unique check (only if it changed)
        if (data.slug !== existingRestaurant[0].slug) {
            const slugExists = await db.select().from(restaurant).where(eq(restaurant.slug, data.slug))
            if (slugExists.length > 0) {
                return { success: false, message: "Slug already exists. Please choose another one." }
            }
        }

        // Prepare update data
        const updateData: {
            name: string
            slug: string
            description?: string | null
            address?: string | null
            pictureUrl?: string | null
            pictureAlt?: string | null
            prepTimeMin?: number | null
            prepTimeMax?: number | null
            lat?: string | null
            lon?: string | null
            phone?: string | null
            email?: string | null
            website?: string | null
            tags?: string[] | null
            menuPictureUrl?: string[] | null
            updatedAt: Date
        } = {
            name: data.name,
            slug: data.slug,
            description: data.description ?? undefined,
            address: data.address ?? undefined,
            prepTimeMin: data.prepTimeMin ?? undefined,
            prepTimeMax: data.prepTimeMax ?? undefined,
            lat: data.lat != null ? data.lat.toString() : undefined,
            lon: data.lon != null ? data.lon.toString() : undefined,
            phone: data.phone ?? undefined,
            email: data.email ?? undefined,
            website: data.website ?? undefined,
            tags: data.tags ?? undefined,
            pictureAlt: data.pictureAlt ?? undefined,
            updatedAt: new Date(),
        }

        // Handle main picture upload
        if (data.picture) {
            try {
                // If there's an existing image, delete it
                if (existingRestaurant[0].pictureUrl) {
                    await del(existingRestaurant[0].pictureUrl);
                }
                
                const pictureUrl = await uploadFileToBlob(data.slug, data.picture);
                if (pictureUrl) {
                    updateData.pictureUrl = pictureUrl;
                }
            } catch (error) {
                console.error("Error updating restaurant picture:", error);
                return { success: false, message: "Error uploading restaurant image" };
            }
        }

        // Handle menu pictures
        if (data.menuPictures && data.menuPictures.length > 0) {
            try {
                // Get existing menu pictures
                const existingMenuUrls = existingRestaurant[0].menuPictureUrl || [];
                
                // Remove any requested deleted images
                if (data.removedMenuPictures && data.removedMenuPictures.length > 0) {
                    // Delete from blob storage
                    for (const url of data.removedMenuPictures) {
                        if (existingMenuUrls.includes(url)) {
                            await del(url);
                        }
                    }
                    
                    // Filter out removed URLs
                    const remainingUrls = existingMenuUrls.filter(url => 
                        !data.removedMenuPictures?.includes(url)
                    );
                    
                    // Upload new menu pictures
                    const newMenuUrls = await uploadMenuFilesToBlob(data.slug, data.menuPictures);
                    
                    // Combine remaining and new URLs
                    updateData.menuPictureUrl = [...remainingUrls, ...newMenuUrls];
                } else {
                    // Just add new pictures to existing ones
                    const newMenuUrls = await uploadMenuFilesToBlob(data.slug, data.menuPictures);
                    updateData.menuPictureUrl = [...existingMenuUrls, ...newMenuUrls];
                }
            } catch (error) {
                console.error("Error updating menu pictures:", error);
                return { success: false, message: "Error uploading menu images: " + (error as Error).message };
            }
        } else if (data.removedMenuPictures && data.removedMenuPictures.length > 0) {
            // Only removing pictures, no new ones
            const existingMenuUrls = existingRestaurant[0].menuPictureUrl || [];
            
            // Delete from blob storage
            for (const url of data.removedMenuPictures) {
                if (existingMenuUrls.includes(url)) {
                    await del(url);
                }
            }
            
            // Filter out removed URLs
            updateData.menuPictureUrl = existingMenuUrls.filter(url => 
                !data.removedMenuPictures?.includes(url)
            );
        }

        // Update restaurant in database
        await db.update(restaurant)
            .set(updateData)
            .where(eq(restaurant.id, data.id));

        revalidatePath("/dashboard/r");
        revalidatePath("/");
        revalidatePath("/es");
        revalidatePath("/en");
        revalidatePath("/es/r");
        revalidatePath("/en/r");
        return { success: true, message: "Restaurant updated successfully" };
    } catch (err) {
        console.error("Update restaurant error:", err);
        return { success: false, message: "Internal Server Error" };
    }
}

export async function getRestaurantById(id: string) {
  try {
    const restaurantData = await db.select().from(restaurant).where(eq(restaurant.id, id)).limit(1);
    if (restaurantData.length === 0) {
      return { success: false, message: "Restaurant not found", data: null };
    }
    return { success: true, data: restaurantData[0] };
  } catch (err) {
    console.error("Get restaurant by id error:", err);
    return { success: false, message: "Internal Server Error", data: null };
  }
}
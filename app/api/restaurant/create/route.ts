import { NextResponse } from "next/server"
import { db } from "@/db/drizzle"
import { restaurant } from "@/db/schema"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { eq } from "drizzle-orm";

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
  pictureUrl?: string
  pictureAlt?: string
}

function isValidEmail(s?: string) {
  return !s || /\S+@\S+\.\S+/.test(s)
}
function isValidUrl(s?: string) {
  return !s || /^https?:\/\/.+\..+/.test(s)
}
function isHttpUrl(s?: string) {
  return !!s && /^https?:\/\//i.test(s)
}
function isDataUrl(s?: string) {
  return !!s && /^data:[^;]+;base64,[A-Za-z0-9+/=]+$/i.test(s)
}
async function fileToDataUrl(file: File): Promise<string> {
  const ab = await file.arrayBuffer()
  const base64 = Buffer.from(ab).toString("base64")
  const mime = file.type || "application/octet-stream"
  return `data:${mime};base64,${base64}`
}
async function urlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`)
  const ct = res.headers.get("content-type") || "application/octet-stream"
  const ab = await res.arrayBuffer()
  const base64 = Buffer.from(ab).toString("base64")
  return `data:${ct};base64,${base64}`
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })
    if (!session) {
      return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 })
    }
    if (!session.user?.role || session.user.role !== "admin") {
      return NextResponse.json({ success: false, message: "Not authorized" }, { status: 403 })
    }

    const formData = await req.formData()

    const data: CreateRestaurantParsed = {
      name: String(formData.get("name") || ""),
      slug: String(formData.get("slug") || ""),
      description: (formData.get("description") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      lat: formData.get("lat") != null ? Number(formData.get("lat")) : undefined,
      lon: formData.get("lon") != null ? Number(formData.get("lon")) : undefined,
      website: (formData.get("website") as string) || undefined,
      phone: (formData.get("phone") as string) || undefined,
      email: (formData.get("email") as string) || undefined,
      prepTimeMin: formData.get("prepTimeMin") != null ? Number(formData.get("prepTimeMin")) : undefined,
      prepTimeMax: formData.get("prepTimeMax") != null ? Number(formData.get("prepTimeMax")) : undefined,
      picture: (formData.get("picture") as File) || null,
      pictureUrl: (formData.get("pictureUrl") as string) || undefined,
      pictureAlt: (formData.get("pictureAlt") as string) || undefined,
    }

    // Validaciones
    if (!data.name || data.name.length < 3) {
      return NextResponse.json({ success: false, message: "Name must be at least 3 characters" }, { status: 400 })
    }
    if (!data.slug || data.slug.length < 3) {
      return NextResponse.json({ success: false, message: "Slug must be at least 3 characters" }, { status: 400 })
    }
    if (data.description && data.description.length > 300) {
      return NextResponse.json({ success: false, message: "Description must be at most 300 characters" }, { status: 400 })
    }
    if (data.address && data.address.length > 300) {
      return NextResponse.json({ success: false, message: "Address must be at most 300 characters" }, { status: 400 })
    }
    if (data.lat != null && (data.lat < -90 || data.lat > 90)) {
      return NextResponse.json({ success: false, message: "Latitude must be between -90 and 90" }, { status: 400 })
    }
    if (data.lon != null && (data.lon < -180 || data.lon > 180)) {
      return NextResponse.json({ success: false, message: "Longitude must be between -180 and 180" }, { status: 400 })
    }
    if (data.phone && data.phone.length < 7) {
      return NextResponse.json({ success: false, message: "Phone number must be at least 7 characters" }, { status: 400 })
    }
    if (!isValidEmail(data.email)) {
      return NextResponse.json({ success: false, message: "Email is not valid" }, { status: 400 })
    }
    if (data.prepTimeMin != null && data.prepTimeMin < 0) {
      return NextResponse.json({ success: false, message: "Minimum preparation time must be at least 0" }, { status: 400 })
    }
    if (data.prepTimeMax != null && data.prepTimeMax < 0) {
      return NextResponse.json({ success: false, message: "Maximum preparation time must be at least 0" }, { status: 400 })
    }
    if (data.prepTimeMin != null && data.prepTimeMax != null && data.prepTimeMin > data.prepTimeMax) {
      return NextResponse.json({ success: false, message: "Minimum preparation time must be less than maximum preparation time" }, { status: 400 })
    }
    if (!isValidUrl(data.website)) {
      return NextResponse.json({ success: false, message: "Website is not valid" }, { status: 400 })
    }
    if (data.pictureAlt && data.pictureAlt.length > 300) {
      return NextResponse.json({ success: false, message: "Picture alt text must be at most 300 characters" }, { status: 400 })
    }

    // Normalizar imagen a Data URL (base64)
    let pictureDataUrl: string | undefined = undefined
    try {
      if (isDataUrl(data.pictureUrl)) {
        pictureDataUrl = data.pictureUrl
      } else if (isHttpUrl(data.pictureUrl)) {
        pictureDataUrl = await urlToDataUrl(data.pictureUrl!)
      } else if (data.picture && typeof data.picture.size === "number" && data.picture.size > 0) {
        pictureDataUrl = await fileToDataUrl(data.picture)
      }
    } catch {
      // Si no se pudo convertir, seguimos sin imagen
    }

    // Slug único
    const existing = await db.select().from(restaurant).where(eq(restaurant.slug, data.slug))
    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: "Slug already exists. Please choose another one." }, { status: 409 })
    }

    await db.insert(restaurant).values({
      id: crypto.randomUUID(),
      name: data.name,
      slug: data.slug,
      description: data.description ?? undefined,
      address: data.address ?? undefined,
      pictureUrl: pictureDataUrl ?? undefined,
      pictureAlt: data.pictureAlt ?? undefined,
      prepTimeMin: data.prepTimeMin ?? undefined,
      prepTimeMax: data.prepTimeMax ?? undefined,
      lat: data.lat != null ? data.lat.toString() : undefined,
      lon: data.lon != null ? data.lon.toString() : undefined,
      phone: data.phone ?? undefined,
      email: data.email ?? undefined,
      website: data.website ?? undefined,
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error("Create restaurant error:", err)
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 })
  }
}
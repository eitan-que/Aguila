"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Dictionary } from "@/actions/dictionaries"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import Image from "next/image"
import { ImagePlus } from "lucide-react"

type OSMAddress = {
  country_code?: string
  state?: string
  province?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
}

type OSMItem = {
  display_name: string
  lat: string
  lon: string
  class?: string
  type?: string
  addresstype?: string
  importance?: number
  address?: OSMAddress
}

type Suggestion = {
  display_name: string
  lat: number
  lon: number
}

type UserLoc = {
  country_code?: string
  city?: string
}

// Helper para consumir la API JSON
async function createRestaurantFromForm(fd: FormData): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch("/api/restaurant/create", {
      method: "POST",
      body: fd,
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      return { success: false, message: json?.message || `Request failed (${res.status})` }
    }
    return (json ?? { success: false, message: "Empty response" })
  } catch {
    return { success: false, message: "Network error" }
  }
}

// Convertir archivo a Data URL (base64) en el cliente
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(file)
  })
}

function AddressAutocomplete(props: {
  value: string
  onChange: (v: string) => void
  onSelect: (s: Suggestion) => void
  placeholder?: string
}) {
  const { value, onChange, onSelect, placeholder } = props
  const [query, setQuery] = useState(value ?? "")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Suggestion[]>([])
  const [userLoc, setUserLoc] = useState<UserLoc | null>(null)

  // Obtener ubicación aproximada por IP (gratis)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("https://ipapi.co/json/")
        const ip = await res.json()
        if (cancelled) return
        setUserLoc({
          country_code: ip?.country_code, // "AR"
          city: ip?.city,                 // ciudad
        })
      } catch {
        // noop
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Mantener controlado desde RHF pero con estado local para UX
  useEffect(() => {
    setQuery(value ?? "")
  }, [value])

  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setResults([])
      return
    }

    const allowedAmenity = new Set([
      "restaurant",
      "fast_food",
      "cafe",
      "bar",
      "pub",
      "food_court",
      "ice_cream",
    ])

    const norm = (s?: string) =>
      (s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")

    const ctrl = new AbortController()
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search")
        url.searchParams.set("q", query)
        url.searchParams.set("format", "json")
        url.searchParams.set("addressdetails", "1")
        url.searchParams.set("limit", "8")
        url.searchParams.set("dedupe", "1")
        url.searchParams.set("countrycodes", "ar") // limitar a Argentina

        const headers: HeadersInit = {
          Accept: "application/json",
          "Accept-Language": "es-AR,es;q=0.9,en;q=0.6",
        }

        const res = await fetch(url.toString(), { signal: ctrl.signal, headers })
        const data: OSMItem[] = await res.json()

        // Prioridad solo por país y ciudad del usuario
        const pl = {
          country: norm(userLoc?.country_code),
          city: norm(userLoc?.city),
        }

        const parsed = (data || []).map(d => ({
          ...d,
          _lat: parseFloat(d.lat),
          _lon: parseFloat(d.lon),
        }))

        const score = (i: (OSMItem & { _lat: number; _lon: number })) => {
          let s = 0

          // Tipo: amenity de comida primero, luego comercios
          if (i.class === "amenity" && i.type && allowedAmenity.has(i.type)) s -= 40
          else if (i.class === "shop") s -= 15

          // País (igual AR por filtro, pero lo dejamos por claridad)
          const ccode = norm(i.address?.country_code)
          if (pl.country && ccode && ccode === norm("AR")) s -= 5

          // Ciudad
          const cityLike = norm(
            i.address?.city ||
            i.address?.town ||
            i.address?.village ||
            i.address?.municipality
          )
          if (pl.city && cityLike && (cityLike === pl.city || cityLike.includes(pl.city))) s -= 22

          // Sin cercanía por coordenadas ni provincia
          // Importancia de Nominatim
          if (typeof i.importance === "number") s -= i.importance * 5

          return s
        }

        const sorted = parsed.sort((a, b) => score(a) - score(b))

        setResults(
          sorted.map((d) => ({
            display_name: d.display_name,
            lat: d._lat,
            lon: d._lon,
          }))
        )
        setOpen(true)
      } catch {
        // noop
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => {
      ctrl.abort()
      clearTimeout(t)
    }
  }, [query, userLoc])

  const handleSelect = (s: Suggestion) => {
    onChange(s.display_name)
    onSelect(s)
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        type="search"
        className="flex bg-background disabled:opacity-50 shadow-sm px-3 py-1 border border-input rounded-md focus:outline-none focus:ring-1 focus:ring-ring w-full h-9 placeholder:text-muted-foreground text-sm transition-colors disabled:cursor-not-allowed"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
        }}
        onFocus={() => {
          if (results.length > 0) setOpen(true)
        }}
        onBlur={() => {
          // pequeño delay para permitir click en item
          setTimeout(() => setOpen(false), 150)
        }}
      />
      {open && (results.length > 0 || loading) && (
        <div className="z-50 absolute bg-popover shadow-md mt-1 p-1 border rounded-md w-full max-h-60 overflow-auto text-popover-foreground">
          {loading && (
            <div className="px-2 py-1.5 text-muted-foreground text-sm">Buscando…</div>
          )}
          {!loading && results.map((s, idx) => (
            <button
              key={`${s.lat}-${s.lon}-${idx}`}
              type="button"
              className="hover:bg-accent px-2 py-1.5 rounded-sm w-full text-sm text-left hover:text-accent-foreground cursor-pointer"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(s)}
              title={`${s.lat}, ${s.lon}`}
            >
              {s.display_name}
            </button>
          ))}
          {!loading && results.length === 0 && (
            <div className="px-2 py-1.5 text-muted-foreground text-sm">Sin resultados</div>
          )}
        </div>
      )}
    </div>
  )
}


export function CreateRestaurantForm(t: Dictionary["dashboard"]["restaurants"]["form"]) {
  const createRestaurantSchema = z.object({
    name: z.string().min(3, {
      message: t.errors.nameMin || "Name must be at least 3 characters.",
    }),
    slug: z.string().min(3, {
      message: t.errors.slugMin || "Slug must be at least 3 characters.",
    }),
    description: z.string().max(300, {
      message: t.errors.descriptionMax || "Description must be at most 300 characters.",
    }).optional(),
    location: z.object({
      address: z.string().optional().or(z.string().max(300, {
        message: t.errors.addressMax || "Address must be at most 300 characters.",
      })),
      lat: z.number().optional().or(z.number().min(-90, {
        message: t.errors.latRange || "Latitude must be at least -90.",
      }).max(90, {
        message: t.errors.latRange || "Latitude must be at most 90.",
      })),
      lon: z.number().optional().or(z.number().min(-180, {
        message: t.errors.lonRange || "Longitude must be at least -180.",
      }).max(180, {
        message: t.errors.lonRange || "Longitude must be at most 180.",
      })),
    }).optional(),
    phone: z.string().optional().or(z.string().min(7, {
      message: t.errors.phoneMin || "Phone must be at least 7 characters.",
    })),
    email: z.string().optional().or(z.string().email({
      message: t.errors.emailInvalid || "Email must be a valid email address.",
    })),
    website: z.string().optional().or(z.string().url({
      message: t.errors.websiteInvalid || "Website must be a valid URL.",
    })),
    prepTimeMin: z.string().optional().or(z.number().min(0, {
      message: t.errors.prepTimeMin || "Preparation time must be at least 0 minutes.",
    })),
    prepTimeMax: z.string().optional().or(z.number().min(0, {
      message: t.errors.prepTimeRange || "Preparation time must be at least 0 minutes.",
    })),
    // Aceptar URL http(s) o Data URL base64
    pictureUrl: z.union([
      z.string().url({ message: "Picture URL must be a valid URL." }),
      z.string().regex(/^data:[^;]+;base64,[A-Za-z0-9+/=]+$/i, { message: "Picture must be a valid base64 data URL." }),
    ]).optional(),
    pictureAlt: z.string().optional().or(z.string().max(300, {
      message: t.errors.pictureAltMax || "Picture alt text must be at most 300 characters.",
    })),
    tags: z.array(
      z.object({
        type: z.enum(['text']),
        text: z.string().optional()
      })
    ).optional(),
  })

  const form = useForm<z.infer<typeof createRestaurantSchema>>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: undefined,
      location: {
        address: undefined,
      },
      phone: undefined,
      email: undefined,
      website: undefined,
      prepTimeMin: undefined,
      prepTimeMax: undefined,
      pictureAlt: undefined,
      tags: undefined,
    },
  })
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = () => {
    const file = fileRef.current?.files?.[0]
    // revocar preview anterior
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old)
      return old
    })
    if (file && file.size > 0) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const onSubmit = async (values: z.infer<typeof createRestaurantSchema>) => {
    const fd = new FormData()
    fd.append("name", values.name)
    fd.append("slug", values.slug)
    if (values.description) fd.append("description", values.description)
    if (values.location?.address) fd.append("address", values.location.address)
    if (values.location?.lat != null) fd.append("lat", values.location.lat.toString())
    if (values.location?.lon != null) fd.append("lon", values.location.lon.toString())
    if (values.phone) fd.append("phone", values.phone)
    if (values.email) fd.append("email", values.email)
    if (values.website) fd.append("website", values.website)
    if (values.prepTimeMin != null) fd.append("prepTimeMin", values.prepTimeMin.toString())
    if (values.prepTimeMax != null) fd.append("prepTimeMax", values.prepTimeMax.toString())
    if (values.pictureAlt) fd.append("pictureAlt", values.pictureAlt)

    // Convertir a base64 (data URL) y mandar como pictureUrl
    const file = fileRef.current?.files?.[0] || null
    if (file && file.size > 0) {
      try {
        const dataUrl = await fileToDataUrl(file)
        fd.append("pictureUrl", dataUrl)
      } catch (e: any) {
        toast.error(e?.message || "Error reading image")
        return
      }
    } else if (values.pictureUrl) {
      // Si ya viene seteada (por algún otro flujo), se respeta
      fd.append("pictureUrl", values.pictureUrl)
    }

    const result = await createRestaurantFromForm(fd)

    if (!result.success) {
      toast.error(result.message || "Error creating restaurant")
      return
    }
    toast.success("Restaurant created successfully")
    form.reset()
    if (fileRef.current) fileRef.current.value = ""
    if (preview) {
      URL.revokeObjectURL(preview)
      setPreview(null)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault()
        }}
        className="space-y-8 overflow-x-visible"
      >
        <div className="space-y-2">
            <h1 className="font-semibold text-lg">
                {t.sections.general || "General Information"}
            </h1>
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">{t.fields.name.label || "Name"}</FormLabel>
                        <FormControl>
                            <Input placeholder={t.fields.name.placeholder || "Enter restaurant name"} {...field} />
                        </FormControl>
                        <FormDescription>{t.fields.name.description || "This is the restaurant's name."}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">{t.fields.slug.label || "Slug"}</FormLabel>
                        <FormControl>
                            <Input placeholder={t.fields.slug.placeholder || "enter-restaurant-slug"} {...field} />
                        </FormControl>
                        <FormDescription>{t.fields.slug.description || "This will be used in the restaurant's URL."}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">{t.fields.description.label || "Description"}</FormLabel>
                        <FormControl>
                            <Textarea placeholder={t.fields.description.placeholder || "Enter restaurant description"} {...field} className="max-h-32"/>
                        </FormControl>
                        <FormDescription>{t.fields.description.description || "This is the restaurant's description."}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="space-y-2">
            <h1 className="font-semibold text-lg">
                {t.sections.picture || "Picture"}
            </h1>
            <FormItem>
                <FormLabel className="font-semibold">{t.fields.pictureUrl?.label || "Picture File"}</FormLabel>
                <FormControl>
                    {preview ? (
                        <div className="relative flex sm:flex-row flex-col justify-center items-center sm:items-center gap-4 bg-muted border border-border rounded-md w-full aspect-video overflow-hidden">
                            <Image src={preview} alt="Preview" className="w-full h-full object-cover" width={1920} height={1080}/>
                        </div>
                    ) : (
                        <label className="flex sm:flex-row flex-col justify-center items-center sm:items-center gap-4 bg-muted border border-border rounded-md w-full aspect-video overflow-hidden">
                            <ImagePlus className="w-10 h-10 text-muted-foreground" />
                            <Input type="file" accept="image/*" ref={fileRef} onChange={handleFileChange} className="hidden"/>
                        </label>
                    )}
                </FormControl>
            </FormItem>
            <FormField
                control={form.control}
                name="pictureAlt"
                render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <Input placeholder={t.fields.pictureAlt.label || "Enter picture alt text"} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="space-y-2">
            <h1 className="font-semibold text-lg">
                {t.sections.location || "Location Information"}
            </h1>
            <FormField
                control={form.control}
                name="location.address"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">{t.fields.location.address.label || "Address"}</FormLabel>
                        <FormControl>
                            <AddressAutocomplete
                                value={field.value ?? ""}
                                onChange={field.onChange}
                                onSelect={(s) => {
                                    field.onChange(s.display_name)
                                    form.setValue("location.lat", s.lat)
                                    form.setValue("location.lon", s.lon)
                                }}
                                placeholder={t.fields.location.address.placeholder || "Buscar dirección o lugar"}
                            />
                        </FormControl>
                        <FormDescription>{t.fields.location.description || "Selecciona una dirección para guardar lat/lon automáticamente."}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="space-y-2">
            <h1 className="font-semibold text-lg">
                {t.sections.contact || "Contact Information"}
            </h1>
            <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">{t.fields.website.label || "Website"}</FormLabel>
                        <FormControl>
                            <Input placeholder={t.fields.website.placeholder || "Enter restaurant website"} {...field} />
                        </FormControl>
                        <FormDescription>{t.fields.website.description || "This is the restaurant's website."}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">{t.fields.email.label || "Email"}</FormLabel>
                        <FormControl>
                            <Input placeholder={t.fields.email.placeholder || "Enter restaurant email"} {...field} />
                        </FormControl>
                        <FormDescription>{t.fields.email.description || "This is the restaurant's email."}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">{t.fields.phone.label || "Phone"}</FormLabel>
                        <FormControl>
                            <Input placeholder={t.fields.phone.placeholder || "Enter restaurant phone number"} {...field} />
                        </FormControl>
                        <FormDescription>{t.fields.phone.description || "This is the restaurant's phone number."}</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <div className="space-y-2">
            <h1 className="font-semibold text-lg">
                {t.sections.prepTime || "Preparation Time"}
            </h1>
            <div className="gap-4 grid sm:grid-cols-2">
                <FormField
                    control={form.control}
                    name="prepTimeMin"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-semibold">{t.fields.prepTimeMin.label || "Preparation Time (Min)"}</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder={t.fields.prepTimeMin.placeholder || "Enter preparation time in minutes"} {...field} />
                            </FormControl>
                            <FormDescription>{t.fields.prepTimeMin.description || "This is the preparation time in minutes."}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="prepTimeMax"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-semibold">{t.fields.prepTimeMax.label || "Preparation Time (Max)"}</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder={t.fields.prepTimeMax.placeholder || "Enter preparation time in minutes"} {...field} />
                            </FormControl>
                            <FormDescription>{t.fields.prepTimeMax.description || "This is the preparation time in minutes."}</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </div>
        <Button type="submit" className="w-full">{t.submit || "Submit"}</Button>
    </form>
    </Form>
  )
}
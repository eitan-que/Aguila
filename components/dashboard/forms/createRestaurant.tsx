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
import { ImagePlus, X } from "lucide-react"
import { CreateRestaurant } from "@/actions/restaurant"
import { Tag, TagInput } from "emblor"

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
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDraggingPicture, setIsDraggingPicture] = useState(false); // New state for restaurant picture drag

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
    picture: z.instanceof(File),
    pictureAlt: z.string().optional().or(z.string().max(300, {
      message: t.errors.pictureAltMax || "Picture alt text must be at most 300 characters.",
    })),
    tags: z.array(
      z.object({
        id: z.string(),
        text: z.string()
      })
    ).optional(),
    menuPictures: z.array(z.instanceof(File)).optional(),
  })

  const form = useForm<z.infer<typeof createRestaurantSchema>>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      location: {
        address: "",
      },
      phone: "",
      email: "",
      website: "",
      prepTimeMin: undefined,
      prepTimeMax: undefined,
      picture: undefined,
      pictureAlt: "",
      tags: undefined,
      menuPictures: [],
    },
  })
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const onSubmit = async (values: z.infer<typeof createRestaurantSchema>) => {
    if (isCreating) return
    setIsCreating(true)

    const result = await toast.promise(
      CreateRestaurant({
        name: values.name,
        slug: values.slug,
        description: values.description,
        address: values.location?.address,
        lat: values.location?.lat,
        lon: values.location?.lon,
        website: values.website,
        phone: values.phone,
        email: values.email,
        prepTimeMin: values.prepTimeMin != null ? Number(values.prepTimeMin) : undefined,
        prepTimeMax: values.prepTimeMax != null ? Number(values.prepTimeMax) : undefined,
        picture: values.picture as File,             // <- clave
        pictureAlt: values.pictureAlt,
        tags: tags.map(t => t.text),
      }),
      {
        loading: "Creating restaurant...",
        success: "Restaurant created successfully!",
        error: (err) => err?.message || "Error creating restaurant",
      }
    )
    if (!result) {
      setIsCreating(false)
      return
    }
    setIsCreating(false)
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
            <FormField
                control={form.control}
                name="picture"
                render={({ field }) => (
                  <FormItem>
                      <FormLabel className="font-semibold">{t.fields.pictureUrl?.label || "Picture File"}</FormLabel>
                      <FormControl>
                          {preview ? (
                              <div className="relative flex sm:flex-row flex-col justify-center items-center sm:items-center gap-4 bg-muted border border-border rounded-md w-full aspect-video overflow-hidden">
                                  <button 
                                    className="top-2 right-2 z-10 absolute bg-card opacity-50 hover:opacity-100 p-2 rounded-full transition-opacity" 
                                    onClick={() => {
                                      // limpiar preview + RHF + input
                                      setPreview((old) => { if (old) URL.revokeObjectURL(old); return null })
                                      if (fileRef.current) fileRef.current.value = ""
                                      field.onChange(undefined) // <- importante
                                    }}
                                    type="button"
                                    title="Remove image"
                                  >
                                      <X className="w-4 h-4 text-card-foreground" />
                                  </button>
                                  <Image src={preview} alt="Preview" className="w-full h-full object-cover" width={1920} height={1080}/>
                              </div>
                          ) : (
                              <label 
                                className="relative flex flex-col justify-center not-data-[files]:justify-center items-center data-[dragging=true]:bg-accent/50 hover:bg-accent/20 p-4 border border-muted-foreground has-[input:focus]:border-ring border-dashed rounded-xl has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 h-min min-h-52 aspect-video overflow-hidden transition-colors cursor-pointer"
                                onDragEnter={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsDraggingPicture(true);
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsDraggingPicture(false);
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setIsDraggingPicture(false);
                                  
                                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    const file = e.dataTransfer.files[0]; // Take only the first file
                                    
                                    // Check file type and size
                                    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
                                      toast.error("File must be a JPG or PNG image");
                                      return;
                                    }
                                    
                                    if (file.size > 5 * 1024 * 1024) {
                                      toast.error("Image size must be less than 5MB");
                                      return;
                                    }
                                    
                                    // Update form field
                                    field.onChange(file);
                                    
                                    // Update preview
                                    setPreview((old) => { 
                                      if (old) URL.revokeObjectURL(old); 
                                      return URL.createObjectURL(file);
                                    });
                                  }
                                }}
                                data-dragging={isDraggingPicture || undefined}
                              >
                                  <div className="flex flex-col justify-center items-center px-4 py-3 text-center">
                                    <div
                                      className="flex justify-center items-center bg-background mb-2 border border-input rounded-full size-11 shrink-0"
                                      data-state={isDraggingPicture ? "dragging" : undefined}
                                    >
                                      <ImagePlus className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                      {t.fields.pictureUrl.description || "Drag and drop your restaurant picture here, or click to select a file."}
                                    </p>
                                  </div>
                                  <Input 
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    ref={fileRef}
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0]
                                      // actualizar RHF
                                      field.onChange(file)
                                      // manejar preview como antes
                                      setPreview((old) => { if (old) URL.revokeObjectURL(old); return old })
                                      if (file && file.size > 0) {
                                        const url = URL.createObjectURL(file)
                                        setPreview(url)
                                      } else {
                                        setPreview(null)
                                      }
                                    }}
                                    name="picture"
                                  />
                              </label>
                          )}
                      </FormControl>
                  </FormItem>
                )}
            />
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
                {t.sections.menuPictures || "Menu Pictures"}
            </h1>
            <FormField
                control={form.control}
                name="menuPictures"
                render={({ field }) => {
                  // Create state for file handling
                  const [isDragging, setIsDragging] = useState(false);
                  const [errors, setErrors] = useState<string[]>([]);
                  const menuFileRef = useRef<HTMLInputElement | null>(null);
                  const [menuPreviews, setMenuPreviews] = useState<Array<{
                    id: string,
                    file: File,
                    preview: string
                  }>>([]);
                  
                  // Maximum file size (5MB)
                  const maxSize = 5 * 1024 * 1024;
                  const maxFiles = 6;
                  
                  // Handle file validation
                  const validateFiles = (fileList: FileList) => {
                    const newErrors: string[] = [];
                    
                    if (menuPreviews.length + fileList.length > maxFiles) {
                      newErrors.push(`You can upload a maximum of ${maxFiles} files.`);
                      return newErrors;
                    }
                    
                    Array.from(fileList).forEach(file => {
                      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
                        newErrors.push(`File "${file.name}" is not a supported image format.`);
                      } else if (file.size > maxSize) {
                        newErrors.push(`File "${file.name}" is too large. Maximum size is 5MB.`);
                      }
                    });
                    
                    return newErrors;
                  };
                  
                  // Handle file addition
                  const addFiles = (fileList: FileList) => {
                    const validationErrors = validateFiles(fileList);
                    if (validationErrors.length > 0) {
                      setErrors(validationErrors);
                      return;
                    }
                    
                    setErrors([]);
                    const newFiles = Array.from(fileList).map(file => {
                      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                      return {
                        id,
                        file,
                        preview: URL.createObjectURL(file)
                      };
                    });
                    
                    const updatedPreviews = [...menuPreviews, ...newFiles];
                    setMenuPreviews(updatedPreviews);
                    
                    // Update form field value with the actual File objects
                    field.onChange(updatedPreviews.map(item => item.file));
                  };
                  
                  // Cleanup previews on unmount
                  useEffect(() => {
                    return () => {
                      menuPreviews.forEach(item => {
                        URL.revokeObjectURL(item.preview);
                      });
                    };
                  }, [menuPreviews]);
                  
                  // Remove a file
                  const removeFile = (id: string) => {
                    const updatedPreviews = menuPreviews.filter(item => item.id !== id);
                    setMenuPreviews(updatedPreviews);
                    field.onChange(updatedPreviews.map(item => item.file));
                  };
                  
                  // Format file size
                  const formatBytes = (bytes: number) => {
                    if (bytes === 0) return '0 Bytes';
                    const k = 1024;
                    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                  };
                  
                  return (
                    <FormItem>
                      <FormLabel className="font-semibold">
                        {t.fields.menuPictures?.label || "Menu Pictures"}
                      </FormLabel>
                      <FormControl>
                        <div className="flex flex-col gap-2">
                          {/* Drop area */}
                          <label
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsDragging(true);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsDragging(false);
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsDragging(false);
                              
                              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                addFiles(e.dataTransfer.files);
                              }
                            }}
                            data-dragging={isDragging || undefined}
                            data-files={menuPreviews.length > 0 || undefined}
                            className="relative flex flex-col justify-center not-data-[files]:justify-center items-center data-[dragging=true]:bg-accent/50 hover:bg-accent/20 p-4 border border-muted-foreground has-[input:focus]:border-ring border-dashed rounded-xl has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 h-min min-h-52 overflow-hidden transition-colors cursor-pointer"
                          >
                            <input
                              ref={menuFileRef}
                              type="file"
                              className="hidden"
                              multiple
                              accept="image/png,image/jpeg,image/jpg"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  addFiles(e.target.files);
                                }
                              }}
                              aria-label="Upload menu image files"
                            />
                            <div className="flex flex-col justify-center items-center px-4 py-3 text-center">
                              <div
                                className="flex justify-center items-center bg-background mb-2 border border-input rounded-full size-11 shrink-0"
                                data-state={isDragging ? "dragging" : undefined}
                              >
                                <ImagePlus className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <p className="text-muted-foreground text-sm">
                                {t.fields.menuPictures.description || "Drag and drop your menu pictures here, or click to select files."}
                              </p>
                              {errors.length > 0 && (
                                <div className="mt-2 text-red-600 text-sm">
                                  {errors.map((error, idx) => (
                                    <div key={idx}>{error}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </label>
                          {/* Previews */}
                          {menuPreviews.length > 0 && (
                            <div className="gap-2 grid grid-cols-2 sm:grid-cols-3">
                              {menuPreviews.map((item) => (
                                <div key={item.id} className="group relative">
                                  <button
                                    type="button"
                                    onClick={() => removeFile(item.id)}
                                    className="top-2 right-2 z-10 absolute bg-card opacity-70 hover:opacity-100 p-1 rounded-full transition-opacity"
                                    title="Remove image"
                                  >
                                    <X className="w-4 h-4 text-card-foreground" />
                                  </button>
                                  <Image
                                    src={item.preview}
                                    alt="Menu Picture Preview"
                                    className="rounded-lg w-full h-auto object-cover aspect-[1/1.414]"
                                    width={1080}
                                    height={1920}
                                  />
                                  <div className="mt-1 text-muted-foreground text-sm text-center">
                                    {item.file.name} ({formatBytes(item.file.size)})
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
            >
            </FormField>
        </div>
        <div className="space-y-2">
            <h1 className="font-semibold text-lg">
                {t.sections.additional || "Additional Information"}
            </h1>
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel className="font-semibold">{t.fields.tags.label || "Tags"}</FormLabel>
                      <FormControl>
                          <TagInput
                            {...field}
                            placeholder={t.fields.tags.itemPlaceholder || "Enter tags"}
                            styleClasses={{
                              tagList: {
                                container: "gap-1",
                              },
                              input:
                                "rounded-md transition-[color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-ring outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                              tag: {
                                body: "relative h-7 bg-background border border-input hover:bg-background rounded-md font-medium text-xs text-muted-foreground ps-2 pe-7",
                                closeButton:
                                  "absolute -inset-y-px -end-px p-0 rounded-s-none rounded-e-md flex size-7 transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-muted-foreground/80 hover:text-foreground",
                              },
                            }}
                            activeTagIndex={activeTagIndex}
                            setActiveTagIndex={setActiveTagIndex}
                            inlineTags={false}
                            inputFieldPosition="top"
                            tags={tags}
                            setTags={(newTags) => {
                              setTags(newTags);
                              form.setValue('tags', newTags as [Tag, ...Tag[]]);
                            }}
                        />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
              )}
            >
            </FormField>
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
        <Button type="submit" className="w-full" disabled={isCreating}>
          {t.submit || "Submit"}
        </Button>
    </form>
    </Form>
  )
}
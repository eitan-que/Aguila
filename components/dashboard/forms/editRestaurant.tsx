"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { UpdateRestaurant } from "@/actions/restaurant"
import { Dictionary } from "@/actions/dictionaries"
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
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { ImagePlus, Trash2, X } from "lucide-react"

type Tag = {
  id: string
  text: string
}

type EditRestaurantFormProps = {
  restaurant: {
    id: string
    name: string
    slug: string
    description?: string
    address?: string
    lat?: string | number
    lon?: string | number
    website?: string
    email?: string
    phone?: string
    prepTimeMin?: number
    prepTimeMax?: number
    pictureUrl?: string
    pictureAlt?: string
    tags?: string[]
    menuPictureUrl?: string[]
  }
  t: Dictionary["dashboard"]["restaurants"]["form"]
  onSuccess?: () => void
}

export function EditRestaurantForm({
  restaurant,
  t,
  onSuccess
}: EditRestaurantFormProps) {
  const [tags, setTags] = useState<Tag[]>(
    restaurant.tags?.map(tag => ({ id: crypto.randomUUID(), text: tag })) || []
  );
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDraggingPicture, setIsDraggingPicture] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null)
  const menuFileRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(restaurant.pictureUrl || null)
  const [menuPreviews, setMenuPreviews] = useState<Array<{
    id: string,
    file?: File,
    preview: string,
    isExisting: boolean
  }>>(
    restaurant.menuPictureUrl?.map(url => ({
      id: crypto.randomUUID(),
      preview: url,
      isExisting: true
    })) || []
  );
  
  const [removedMenuPictures, setRemovedMenuPictures] = useState<string[]>([]);
  
  // Lift these states up from the FormField callback
  const [menuDragging, setMenuDragging] = useState(false);
  const [menuErrors, setMenuErrors] = useState<string[]>([]);

  // Maximum file size (5MB) and max files
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
      if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
        newErrors.push(`File "${file.name}" is not a supported image format.`);
      } else if (file.size > maxSize) {
        newErrors.push(`File "${file.name}" is too large. Maximum size is 5MB.`);
      }
    });
    
    return newErrors;
  };
  
  // Handle file addition
  const addMenuFiles = (fileList: FileList, onChange: (files: File[]) => void) => {
    const validationErrors = validateFiles(fileList);
    if (validationErrors.length > 0) {
      setMenuErrors(validationErrors);
      return;
    }
    
    setMenuErrors([]);
    const newFiles = Array.from(fileList).map(file => {
      const id = `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id,
        file,
        preview: URL.createObjectURL(file),
        isExisting: false
      };
    });
    
    const updatedPreviews = [...menuPreviews, ...newFiles];
    setMenuPreviews(updatedPreviews);
    
    // Update form field value with the actual File objects
    const newFiles2 = updatedPreviews
      .filter(item => !item.isExisting && item.file)
      .map(item => item.file!);
    onChange(newFiles2);
  };
  
  // Remove a file
  const removeMenuFile = (id: string, onChange: (files: File[]) => void) => {
    const fileToRemove = menuPreviews.find(item => item.id === id);
    
    // If it's an existing file, add to removedMenuPictures
    if (fileToRemove?.isExisting) {
      setRemovedMenuPictures(prev => [...prev, fileToRemove.preview]);
    }
    
    const updatedPreviews = menuPreviews.filter(item => item.id !== id);
    setMenuPreviews(updatedPreviews);
    
    // Update form field value with remaining File objects
    const remainingFiles = updatedPreviews
      .filter(item => !item.isExisting && item.file)
      .map(item => item.file!);
    onChange(remainingFiles);
  };
  
  // Format file size
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    return () => {
      if (preview && !restaurant.pictureUrl?.includes(preview)) URL.revokeObjectURL(preview)
      
      // Clean up menu previews
      menuPreviews.forEach(item => {
        if (!item.isExisting) {
          URL.revokeObjectURL(item.preview);
        }
      });
    }
  }, [])

  const editRestaurantSchema = z.object({
    name: z.string().min(3, {
      message: t?.errors?.nameMin || "Name must be at least 3 characters.",
    }),
    slug: z.string().min(3, {
      message: t?.errors?.slugMin || "Slug must be at least 3 characters.",
    }),
    description: z.string().max(300, {
      message: t?.errors?.descriptionMax || "Description must be at most 300 characters.",
    }).optional(),
    location: z.object({
      address: z.string().optional().or(z.string().max(300, {
        message: t?.errors?.addressMax || "Address must be at most 300 characters.",
      })),
      lat: z.number().optional().or(z.number().min(-90, {
        message: t?.errors?.latRange || "Latitude must be at least -90.",
      }).max(90, {
        message: t?.errors?.latRange || "Latitude must be at most 90.",
      })),
      lon: z.number().optional().or(z.number().min(-180, {
        message: t?.errors?.lonRange || "Longitude must be at least -180.",
      }).max(180, {
        message: t?.errors?.lonRange || "Longitude must be at most 180.",
      })),
    }).optional(),
    phone: z.string().optional().or(z.string().min(7, {
      message: t?.errors?.phoneMin || "Phone must be at least 7 characters.",
    })),
    email: z.string().optional().or(z.string().email({
      message: t?.errors?.emailInvalid || "Email must be a valid email address.",
    })),
    website: z.string().optional().or(z.string().url({
      message: t?.errors?.websiteInvalid || "Website must be a valid URL.",
    })),
    prepTimeMin: z.string().optional().or(z.number().min(0, {
      message: t?.errors?.prepTimeMin || "Preparation time must be at least 0 minutes.",
    })),
    prepTimeMax: z.string().optional().or(z.number().min(0, {
      message: t?.errors?.prepTimeRange || "Preparation time must be at least 0 minutes.",
    })),
    picture: z.instanceof(File).optional(),
    pictureAlt: z.string().optional().or(z.string().max(300, {
      message: t?.errors?.pictureAltMax || "Picture alt text must be at most 300 characters.",
    })),
    tags: z.array(
      z.object({
        id: z.string(),
        text: z.string()
      })
    ).optional(),
    menuPictures: z.array(z.instanceof(File)).optional(),
  })

  const form = useForm<z.infer<typeof editRestaurantSchema>>({
    resolver: zodResolver(editRestaurantSchema),
    defaultValues: {
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description || "",
      location: {
        address: restaurant.address || "",
        lat: restaurant.lat ? parseFloat(restaurant.lat as string) : undefined,
        lon: restaurant.lon ? parseFloat(restaurant.lon as string) : undefined,
      },
      phone: restaurant.phone || "",
      email: restaurant.email || "",
      website: restaurant.website || "",
      prepTimeMin: restaurant.prepTimeMin,
      prepTimeMax: restaurant.prepTimeMax,
      picture: undefined,
      pictureAlt: restaurant.pictureAlt || "",
      tags: tags,
      menuPictures: [],
    },
  })

  const onSubmit = async (values: z.infer<typeof editRestaurantSchema>) => {
    if (isUpdating) return
    setIsUpdating(true)

    try {
      const result = await toast.promise(
        UpdateRestaurant({
          id: restaurant.id,
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
          picture: values.picture || null,
          pictureAlt: values.pictureAlt,
          tags: tags.map(t => t.text),
          menuPictures: values.menuPictures || null,
          removedMenuPictures
        }),
        {
          loading: "Updating restaurant...",
          success: "Restaurant updated successfully!",
          error: (err) => err?.message || "Error updating restaurant",
        }
      );

      const unwrappedResult = await result.unwrap();
      if (unwrappedResult.success) {
        // Reset file inputs
        if (fileRef.current) fileRef.current.value = ""
        if (menuFileRef.current) menuFileRef.current.value = ""
        
        // Call success callback if provided
        if (onSuccess) onSuccess();
      }
    } finally {
      setIsUpdating(false);
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
                {t?.sections?.general || "General Information"}
            </h1>
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">{t?.fields?.name?.label || "Name"}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t?.fields?.name?.placeholder || "Enter restaurant name"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t?.fields?.name?.description || "The name of your restaurant as it will appear to customers."}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">{t?.fields?.slug?.label || "Slug"}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t?.fields?.slug?.placeholder || "unique-identifier"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t?.fields?.slug?.description || "URL-friendly identifier. Use only lowercase letters, numbers, and hyphens."}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">{t?.fields?.description?.label || "Description"}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t?.fields?.description?.placeholder || "Brief description of your restaurant"} 
                            {...field} 
                            className="resize-none"
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          {t?.fields?.description?.description || "A short description of your restaurant (max 300 characters)."}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        {/* Location information */}
        <div className="space-y-2">
            <h1 className="font-semibold text-lg">
                {t?.sections?.location || "Location Information"}
            </h1>
            <FormField
                control={form.control}
                name="location.address"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">{t?.fields?.location?.address.label || "Address"}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t?.fields?.location?.address.placeholder || "Enter physical address"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t?.fields?.location?.description || "Street address, city, state, zip code."}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="gap-4 grid grid-cols-2">
              <FormField
                  control={form.control}
                  name="location.lat"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel className="font-semibold">{t?.fields?.location?.lat.label || "Latitude"}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="-34.55024194" 
                              type="number"
                              step="0.000000001"
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
              />
              <FormField
                  control={form.control}
                  name="location.lon"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel className="font-semibold">{t?.fields?.location?.lon.label || "Longitude"}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="-58.45414389" 
                              type="number"
                              step="0.000000001"
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
              />
            </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2">
            <h1 className="font-semibold text-lg">
                {t?.sections?.contact || "Contact Information"}
            </h1>
            <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">{t?.fields?.website?.label || "Website"}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t?.fields?.website?.placeholder || "https://yourwebsite.com"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          {t?.fields?.website?.description || "Official website URL (include https://)."}
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">{t?.fields?.email?.label || "Email"}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t?.fields?.email?.placeholder || "contact@example.com"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">{t?.fields?.phone?.label || "Phone"}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t?.fields?.phone?.placeholder || "+54 (11) 1234-5678"} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

        {/* Main Image */}
        <div className="space-y-2">
          <h1 className="font-semibold text-lg">
            {t?.sections?.picture || "Media & Images"}
          </h1>
          <FormField
            control={form.control}
            name="picture"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">{t?.fields?.pictureUrl?.label || "Main Picture"}</FormLabel>
                <FormDescription>
                  {t?.fields?.pictureUrl?.description || "Upload a high-quality image representing your restaurant."}
                </FormDescription>
                <FormControl>
                  {preview ? (
                    <div className="relative flex justify-center items-center gap-4 bg-muted border border-border rounded-md w-full aspect-video overflow-hidden">
                      <button 
                        className="top-2 right-2 z-10 absolute bg-card opacity-50 hover:opacity-100 p-2 rounded-full transition-opacity" 
                        onClick={() => {
                          setPreview((old) => { 
                            if (old && !restaurant.pictureUrl?.includes(old)) URL.revokeObjectURL(old); 
                            return null 
                          })
                          if (fileRef.current) fileRef.current.value = ""
                          field.onChange(undefined)
                        }}
                        type="button"
                        title={t?.actions?.removeImage || "Remove image"}
                      >
                        <X className="w-4 h-4 text-card-foreground" />
                      </button>
                      <Image 
                        src={preview} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                        width={1920} 
                        height={1080}
                      />
                    </div>
                  ) : (
                    <label 
                      className="relative flex flex-col justify-center items-center data-[dragging=true]:bg-accent/50 hover:bg-accent/20 p-4 border border-muted-foreground has-[input:focus]:border-ring border-dashed rounded-xl has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 h-min min-h-52 aspect-video overflow-hidden transition-colors cursor-pointer"
                      onDragEnter={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsDraggingPicture(true)
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsDraggingPicture(false)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsDraggingPicture(false)
                        
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const file = e.dataTransfer.files[0]
                          
                          // Check file type and size
                          if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
                            toast.error(t?.errors?.fileFormat || "File must be a JPG or PNG image")
                            return
                          }
                          
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error(t?.errors?.fileSize || "Image size must be less than 5MB")
                            return
                          }
                          
                          field.onChange(file)
                          
                          setPreview((old) => { 
                            if (old && !restaurant.pictureUrl?.includes(old)) URL.revokeObjectURL(old)
                            return URL.createObjectURL(file)
                          })
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
                          {t?.fields?.pictureUrl?.actions?.add || "Drag and drop your restaurant image here, or click to select a file."}
                        </p>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {t?.fields?.pictureUrl?.format || "JPG or PNG, max 5MB"}
                        </p>
                      </div>
                      <Input 
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        ref={fileRef}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          field.onChange(file)
                          setPreview((old) => { 
                            if (old && !restaurant.pictureUrl?.includes(old)) URL.revokeObjectURL(old)
                            return old 
                          })
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
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="pictureAlt"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">{t?.fields?.pictureAlt?.label || "Picture Description"}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t?.fields?.pictureAlt?.placeholder || "Briefly describe the image content"} 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  {t?.fields?.pictureAlt?.description || "Alternative text for accessibility and SEO."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Menu Pictures Section */}
          <FormField
            control={form.control}
            name="menuPictures"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-semibold">{t?.fields?.menuPictures?.label || "Menu Pictures"}</FormLabel>
                <FormDescription>
                  {t?.fields?.menuPictures?.description || "Upload images of your menu."}
                </FormDescription>
                <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {menuPreviews.map((item) => (
                    <div key={item.id} className="relative border border-border rounded-lg overflow-hidden">
                      <div className="relative w-full aspect-video">
                        <Image
                          src={item.preview}
                          alt="Menu preview"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="top-2 right-2 absolute">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => removeMenuFile(item.id, field.onChange)}
                          className="w-8 h-8"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                      <div className="p-2 text-muted-foreground text-xs truncate">
                        {item.isExisting ? "Existing image" : item.file?.name}
                      </div>
                    </div>
                  ))}
                  
                  {menuPreviews.length < maxFiles && (
                    <label
                      className="flex flex-col justify-center items-center hover:bg-accent/20 border border-muted-foreground border-dashed rounded-lg aspect-video transition-colors cursor-pointer"
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuDragging(false);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuDragging(false);
                        
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const validationErrors = validateFiles(e.dataTransfer.files);
                          if (validationErrors.length > 0) {
                            setMenuErrors(validationErrors);
                            return;
                          }
                          
                          addMenuFiles(e.dataTransfer.files, field.onChange);
                        }
                      }}
                    >
                      <div className="flex flex-col items-center space-y-2 p-4">
                        <ImagePlus className="w-8 h-8 text-muted-foreground" />
                        <span className="text-muted-foreground text-sm text-center">
                          {t?.fields?.menuPictures?.actions?.add || "Drag & drop menu image or click to browse"}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {t?.fields?.menuPictures?.format || "JPG or PNG, max 5MB"}
                        </span>
                      </div>
                      <Input
                        ref={menuFileRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            const validationErrors = validateFiles(e.target.files);
                            if (validationErrors.length > 0) {
                              setMenuErrors(validationErrors);
                              return;
                            }
                            
                            addMenuFiles(e.target.files, field.onChange);
                            e.target.value = ''; // Reset the input
                          }
                        }}
                        multiple
                      />
                    </label>
                  )}
                </div>
                
                {menuErrors.length > 0 && (
                  <div className="text-destructive text-sm">
                    <ul className="space-y-1 pl-4 list-disc">
                      {menuErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Additional Information */}
        <div className="space-y-2">
          <h1 className="font-semibold text-lg">
            {t?.sections?.additional || "Additional Information"}
          </h1>
          
          <div className="gap-4 grid grid-cols-2">
            <FormField
              control={form.control}
              name="prepTimeMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">{t?.fields?.prepTimeMin?.label || "Min Prep Time (min)"}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="15" 
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    {t?.fields?.prepTimeMin?.description || "Minimum preparation time in minutes"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prepTimeMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold">{t?.fields?.prepTimeMax?.label || "Max Prep Time (min)"}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="30" 
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>
                    {t?.fields?.prepTimeMax?.description || "Maximum preparation time in minutes"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isUpdating}>
          {isUpdating 
            ? (t?.actions?.updating || "Updating...") 
            : (t?.actions?.update || "Update Restaurant")}
        </Button>
      </form>
    </Form>
  )
}
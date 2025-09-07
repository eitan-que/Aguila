"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import Image from "next/image"
import { ImagePlus, X } from "lucide-react"

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
import { Dictionary } from "@/actions/dictionaries"
import { createDiscount } from "@/actions/discounts"

type CreateDiscountFormProps = {
  restaurantId: string
  restaurantName?: string
  t: Dictionary["dashboard"]["restaurants"]["discounts"]["form"]
  onSuccess?: () => void
}

export function CreateDiscountForm({
  restaurantId,
  restaurantName,
  t,
  onSuccess
}: CreateDiscountFormProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const createDiscountSchema = z.object({
    name: z.string().min(3, {
      message: t?.errors?.nameMin || "Name must be at least 3 characters.",
    }),
    description: z.string().max(300, {
      message: t?.errors?.descriptionMax || "Description must be at most 300 characters.",
    }).optional(),
    image: z.instanceof(File, {
      message: t?.errors?.pictureRequired || "A picture is required",
    }),
    imageAlt: z.string().max(300, {
      message: t?.errors?.pictureAltMax || "Image alt text must be at most 300 characters.",
    }).optional(),
  })

  const form = useForm<z.infer<typeof createDiscountSchema>>({
    resolver: zodResolver(createDiscountSchema),
    defaultValues: {
      name: "",
      description: "",
      image: undefined,
      imageAlt: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof createDiscountSchema>) => {
    if (isCreating) return
    setIsCreating(true)

    try {
      const result = await toast.promise(
        createDiscount({
          name: values.name,
          description: values.description || "",
          image: values.image,
          imageAlt: values.imageAlt || "",
          restaurantId
        }),
        {
          loading: t?.toasts?.creating || "Creating discount...",
          success: t?.toasts?.success || "Discount created successfully!",
          error: (err) => err?.message || t?.toasts?.error || "Error creating discount",
        }
      )

      if (result) {
        // Clean up
        if (fileRef.current) fileRef.current.value = ""
        if (preview) {
          URL.revokeObjectURL(preview)
          setPreview(null)
        }
        
        // Reset form
        form.reset()
        
        // Call success callback if provided
        if (onSuccess) onSuccess()
      }
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 overflow-x-visible"
      >
        {restaurantName && (
          <div className="text-muted-foreground text-sm">
            {t?.forRestaurant || "Creating discount for"}: <span className="font-semibold">{restaurantName}</span>
          </div>
        )}
        
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">{t?.fields?.name?.label || "Discount Name"}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={t?.fields?.name?.placeholder || "Enter discount name"} 
                    {...field} 
                  />
                </FormControl>
                <FormDescription>
                  {t?.fields?.name?.description || "The name of the discount as it will appear to customers."}
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
                    placeholder={t?.fields?.description?.placeholder || "Enter discount description"} 
                    {...field} 
                    className="max-h-32"
                  />
                </FormControl>
                <FormDescription>
                  {t?.fields?.description?.description || "Describe the terms or details of this discount."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="font-semibold">{t?.fields.pictureUrl.label || "Discount Image"}</FormLabel>
                  <FormControl>
                    {preview ? (
                      <div className="relative flex justify-center items-center gap-4 bg-muted border border-border rounded-md w-full aspect-video overflow-hidden">
                        <button 
                          className="top-2 right-2 z-10 absolute bg-card opacity-50 hover:opacity-100 p-2 rounded-full transition-opacity" 
                          onClick={() => {
                            setPreview((old) => { if (old) URL.revokeObjectURL(old); return null })
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
                          setIsDraggingImage(true)
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsDraggingImage(false)
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setIsDraggingImage(false)
                          
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            const file = e.dataTransfer.files[0] // Take only the first file
                            
                            // Check file type and size
                            if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
                              toast.error(t?.errors?.fileFormat || "File must be a JPG or PNG image")
                              return
                            }
                            
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error(t?.errors?.fileSize || "Image size must be less than 5MB")
                              return
                            }
                            
                            // Update form field
                            field.onChange(file)
                            
                            // Update preview
                            setPreview((old) => { 
                              if (old) URL.revokeObjectURL(old) 
                              return URL.createObjectURL(file)
                            })
                          }
                        }}
                        data-dragging={isDraggingImage || undefined}
                      >
                        <div className="flex flex-col justify-center items-center px-4 py-3 text-center">
                          <div
                            className="flex justify-center items-center bg-background mb-2 border border-input rounded-full size-11 shrink-0"
                            data-state={isDraggingImage ? "dragging" : undefined}
                          >
                            <ImagePlus className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {t?.fields?.pictureUrl?.description || "Drag and drop your discount image here, or click to select a file."}
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
                            setPreview((old) => { if (old) URL.revokeObjectURL(old); return old })
                            if (file && file.size > 0) {
                              const url = URL.createObjectURL(file)
                              setPreview(url)
                            } else {
                              setPreview(null)
                            }
                          }}
                          name="image"
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
              name="imageAlt"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="font-semibold">{t?.fields?.pictureAlt?.label || "Image Description"}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={t?.fields?.pictureAlt?.placeholder || "Briefly describe the image content"} 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    {t?.fields?.pictureAlt?.description || "Used for accessibility and SEO."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isCreating}
        >
          {isCreating 
            ? (t?.actions?.creating || "Creating...") 
            : (t?.actions?.create || "Create Discount")}
        </Button>
      </form>
    </Form>
  )
}
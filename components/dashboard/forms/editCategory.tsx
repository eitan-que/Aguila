"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react"
import { toast } from "sonner"

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
import { updateCategory } from "@/actions/category"
import { Dictionary } from "@/actions/dictionaries"

type EditCategoryFormProps = {
  category: {
    id: string
    name: string
    description?: string | null
  }
  t: Dictionary["dashboard"]["categories"]["form"]
  onSuccess?: () => void
}

export function EditCategoryForm({
  category,
  t,
  onSuccess
}: EditCategoryFormProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const editCategorySchema = z.object({
    name: z.string().min(2, {
      message: t?.errors?.nameMin || "Name must be at least 2 characters",
    }),
    description: z.string().optional(),
  })

  const form = useForm<z.infer<typeof editCategorySchema>>({
    resolver: zodResolver(editCategorySchema),
    defaultValues: {
      name: category.name,
      description: category.description || "",
    },
  })

  const onSubmit = async (values: z.infer<typeof editCategorySchema>) => {
    if (isUpdating) return
    setIsUpdating(true)

    try {
      const result = await toast.promise(
        updateCategory({
          id: category.id,
          name: values.name,
          description: values.description,
        }),
        {
          loading: t?.toasts?.updating || "Updating category...",
          success: t?.toasts?.updateSuccess || "Category updated successfully!",
          error: (err) => err?.message || t?.toasts?.updateError || "Error updating category",
        }
      )

      const unwrappedResult = await result.unwrap()
      if (unwrappedResult.success && onSuccess) {
        onSuccess()
      }
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t?.fields?.name?.label || "Name"}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={t?.fields?.name?.placeholder || "Enter category name"} 
                  {...field}
                  autoFocus 
                />
              </FormControl>
              <FormDescription>
                {t?.fields?.name?.description || "The name of the category as it will appear in the dashboard and app."}
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
              <FormLabel>{t?.fields?.description?.label || "Description"}</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder={t?.fields?.description?.placeholder || "Enter category description (optional)"} 
                  {...field} 
                  className="resize-none"
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                {t?.fields?.description?.description || "A brief description of what this category represents."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isUpdating}
        >
          {isUpdating 
            ? (t?.actions?.updating || "Updating...") 
            : (t?.actions?.update || "Update Category")}
        </Button>
      </form>
    </Form>
  )
}
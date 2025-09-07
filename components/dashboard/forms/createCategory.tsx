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
import { createCategory } from "@/actions/category"
import { Dictionary } from "@/actions/dictionaries"

type CreateCategoryFormProps = Dictionary["dashboard"]["categories"]["form"]

export function CreateCategoryForm(t: CreateCategoryFormProps) {
  const [isCreating, setIsCreating] = useState(false)

  const createCategorySchema = z.object({
    name: z.string().min(2, {
      message: t?.errors?.nameMin || "Name must be at least 2 characters",
    }),
  })

  const form = useForm<z.infer<typeof createCategorySchema>>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof createCategorySchema>) => {
    if (isCreating) return
    setIsCreating(true)

    try {
      const result = await toast.promise(
        createCategory({
          name: values.name,
        }),
        {
          loading: t?.toasts?.creating || "Creating category...",
          success: t?.toasts?.success || "Category created successfully!",
          error: (err) => err?.message || t?.toasts?.error || "Error creating category",
        }
      )

      if (result) {
        form.reset()
      }
    } finally {
      setIsCreating(false)
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

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isCreating}
        >
          {isCreating 
            ? (t?.actions?.creating || "Creating...") 
            : (t?.actions?.create || "Create Category")}
        </Button>
      </form>
    </Form>
  )
}
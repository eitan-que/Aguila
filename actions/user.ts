"use server"

import { auth } from "@/lib/auth"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { headers } from "next/headers"
import { db } from "@/db/drizzle"

const UpdateNameSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters"
  }).max(100, {
    message: "Name must be less than 100 characters"
  }),
})

export type UpdateNameResult = {
  success: boolean
  message?: string
  fieldErrors?: {
    name?: string[]
  }
}

export async function updateUserName(prevState: UpdateNameResult, formData: FormData): Promise<UpdateNameResult> {
  try {
    // Verify user session
    const session = await auth.api.getSession({
        headers: await headers()
    })
    
    if (!session?.user) {
      return {
        success: false,
        message: "Not authenticated"
      }
    }

    // Parse and validate form data
    const name = formData.get("name") as string
    const validation = UpdateNameSchema.safeParse({ name })
    
    if (!validation.success) {
      return {
        success: false,
        fieldErrors: {
          name: validation.error.flatten().fieldErrors.name
        }
      }
    }

    // Update user in database
    await db.update(user)
      .set({ 
        name: validation.data.name,
        updatedAt: new Date()
      })
      .where(eq(user.id, session.user.id))

    // Refresh data
    revalidatePath("es/account")
    revalidatePath("en/account")

    return {
      success: true,
      message: "Name updated successfully"
    }
    
  } catch (error) {
    console.error("Error updating name:", error)
    return {
      success: false,
      message: "An error occurred while updating your name"
    }
  }
}
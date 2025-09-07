"use client"

import { Dictionary } from "@/actions/dictionaries"
import { DrawerDialogTemplate } from "@/components/dashboard/drawerDialogTemplate"
import { CreateDiscountForm } from "@/components/dashboard/forms/createDiscount"
import { useState } from "react"

type AddDiscountDialogProps = {
  restaurantId: string
  restaurantName: string
  t: Dictionary["dashboard"]
  onSuccess?: () => void
}

export function AddDiscountDialog({
  restaurantId,
  restaurantName,
  t,
  onSuccess
}: AddDiscountDialogProps) {
  // State to control form dialog visibility
  const [isOpen, setIsOpen] = useState(false)
  
  // Handle form submission success
  const handleSuccess = () => {
    setIsOpen(false)
    if (onSuccess) onSuccess()
  }
  
  return (
    <DrawerDialogTemplate
      triggerText={t.restaurants.discounts?.add.trigger || "Add Discount"}
      title={t.restaurants.discounts?.add?.title || "Create New Discount"}
      description={t.restaurants.discounts?.add?.description || `Create a new discount for ${restaurantName}`}
      form={
        <CreateDiscountForm
          restaurantId={restaurantId}
          restaurantName={restaurantName}
          t={t.restaurants.discounts?.form}
          onSuccess={handleSuccess}
        />
      }
    />
  )
}
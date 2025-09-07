"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"

type DrawerDialogTemplateProps = {
  triggerText: string
  title: string
  description?: string
  form: React.ReactElement
}

export function DrawerDialogTemplate({
  triggerText,
  title,
  description,
  form
}: DrawerDialogTemplateProps) {
  const [open, setOpen] = React.useState(false)
  const isDesktop = !useIsMobile()

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">{triggerText}</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg overflow-hidden">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-x-visible overflow-y-auto">
            {form}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">{triggerText}</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex-1 px-4 overflow-x-visible overflow-y-auto">
          {form}
        </div>
        <DrawerFooter className="pt-2">
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
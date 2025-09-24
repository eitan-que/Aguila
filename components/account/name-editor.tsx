"use client"

import { useState } from "react"
import { Dictionary } from "@/actions/dictionaries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { updateUserName } from "@/actions/user"
import { useFormState } from "react-dom"
import { Edit2, CheckCircle, X, Loader2 } from "lucide-react"

const initialState = {
  success: false,
  message: "",
  fieldErrors: {
    name: []
  }
}

interface NameEditorProps {
  dictionary: Dictionary
  initialName: string
}

export default function NameEditor({ dictionary, initialName }: NameEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialName || "")
  const [state, formAction] = useFormState(updateUserName, initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle form submission including the loading state
  const handleSubmit = async (formData: FormData) => {
    if (name === initialName) {
      setIsEditing(false)
      return
    }
    setIsSubmitting(true)
    await formAction(formData)
    setIsSubmitting(false)
    setIsEditing(false)
  }

  // Handle success/error messages when state changes
  if (state.message && !isSubmitting) {
    if (state.success) {
      toast.success(state.message)
      setIsEditing(false)
    } else {
      toast.error(state.message)
    }
    // Reset message to avoid showing it again
    state.message = ""
  }

  if (!isEditing) {
    return (
      <div className="flex justify-between items-center pb-2 border-b w-full">
        <div>
          <span className="text-muted-foreground">{dictionary.account.personalInfo.name}: </span>
          <span className="font-medium">{initialName || dictionary.account.personalInfo.noName}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsEditing(true)}
          className="h-8"
        >
          <Edit2 className="mr-2 w-4 h-4" />
          {dictionary.account.actions.edit}
        </Button>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="w-full">
      <div className="flex flex-col items-end gap-2 pb-2 border-b w-full">
        <div className="flex-1 w-full">
          <label htmlFor="name" className="block mb-1 font-medium text-sm">
            {dictionary.account.personalInfo.name}
          </label>
          <Input
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={dictionary.account.personalInfo.namePlaceholder}
            className={state.fieldErrors?.name ? "border-destructive" : ""}
          />
          {state.fieldErrors?.name && (
            <p className="mt-1 text-destructive text-sm">{state.fieldErrors.name[0]}</p>
          )}
        </div>
        <div className="flex gap-1 w-full">
          <Button 
            type="submit" 
            size="sm"
            disabled={isSubmitting}
            className="flex-1 justify-center w-full h-9"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 w-4 h-4" />
            )}
            {dictionary.account.actions.save}
          </Button>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setIsEditing(false)
              setName(initialName || "")
            }}
            disabled={isSubmitting}
            className="flex-1 justify-center w-full h-9"
          >
            <X className="mr-2 w-4 h-4" />
            {dictionary.account.actions.cancel}
          </Button>
        </div>
      </div>
    </form>
  )
}
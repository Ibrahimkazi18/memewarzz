"use client"

import type React from "react"

import { useState, useTransition, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createMeme } from "@/app/actions"
import { Loader2, UploadCloud } from "lucide-react"
import { toast } from "sonner"

interface CreateMemeModalProps {
  children: React.ReactNode
}

export function CreateMemeModal({ children }: CreateMemeModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewImage(null)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createMeme(formData)
      if (result?.error) {
        toast.error("Error creating meme");
        console.error("Meme creation error:", result.error);
      } else {
        toast.message("Meme created!", {
            description: "Your masterpiece has been shared.",
        });
        setIsOpen(false) // Close modal on success
        setPreviewImage(null) // Clear preview
        formRef.current?.reset() // Reset form fields
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Meme</DialogTitle>
          <DialogDescription>Upload your meme image and add a caption.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="image">Meme Image</Label>
            <Input id="image" name="image" type="file" accept="image/*" required onChange={handleFileChange} />
            {previewImage && (
              <div className="mt-2 flex justify-center">
                <img
                  src={previewImage || "/placeholder.svg"}
                  alt="Meme Preview"
                  className="max-h-48 object-contain rounded-md"
                />
              </div>
            )}
            {!previewImage && (
              <div className="mt-2 flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-md text-muted-foreground">
                <UploadCloud className="w-8 h-8 mb-2" />
                <span>Upload an image</span>
              </div>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="caption">Caption (Optional)</Label>
            <Textarea id="caption" name="caption" placeholder="Add a witty caption..." className="resize-y" />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              "Create Meme"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

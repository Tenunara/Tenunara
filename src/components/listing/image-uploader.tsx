"use client"

import { useState, useRef, type DragEvent } from "react"
import { Upload, Image, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
  onImagesReady: (base64Array: string[]) => void
  maxImages?: number
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_IMAGES = 5

export function ImageUploader({ onImagesReady, maxImages = MAX_IMAGES }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [images, setImages] = useState<{ base64: string; file: File; preview: string }[]>([])
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isDragOver, setIsDragOver] = useState(false)

  const processFiles = (files: FileList) => {
    setErrorMessage("")
    const fileArr = Array.from(files)
    const remaining = maxImages - images.length

    if (fileArr.length > remaining) {
      setErrorMessage(`Maksimal ${maxImages} foto. Sisa slot: ${remaining}`)
      return
    }

    const validFiles: { base64: string; file: File; preview: string }[] = []

    for (const file of fileArr) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setErrorMessage(`Format ${file.type} tidak didukung. Hanya JPG, PNG, WebP.`)
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage(`File ${file.name} terlalu besar. Maksimal 10MB.`)
        return
      }
      validFiles.push({ base64: "", file, preview: URL.createObjectURL(file) })
    }

    // Read all files as base64
    const updated = [...images]
    let pending = validFiles.length

    validFiles.forEach((item, idx) => {
      const reader = new FileReader()
      reader.onload = () => {
        item.base64 = reader.result as string
        updated.push(item)
        pending--
        if (pending === 0) {
          setImages([...updated])
          if (updated.length > 0) {
            onImagesReady(updated.map((i) => i.base64))
          }
        }
      }
      reader.onerror = () => {
        setErrorMessage("Gagal membaca file")
        pending--
        if (pending === 0) {
          setImages([...updated])
        }
      }
      reader.readAsDataURL(item.file)
    })
  }

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index)
    setImages(updated)
    if (updated.length > 0) {
      onImagesReady(updated.map((i) => i.base64))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    processFiles(files)
    e.target.value = ""
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) processFiles(files)
  }

  const canAddMore = images.length < maxImages

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-tenunara-charcoal">
        Upload Foto Kain ({images.length}/{maxImages})
      </p>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
          {images.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl bg-tenunara-mint/30">
              <img src={img.preview} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
              <span className="absolute bottom-1 left-1 rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] text-white">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <div
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-200",
            "hover:border-tenunara-terracotta hover:bg-tenunara-terracotta/5",
            isDragOver && "border-tenunara-terracotta bg-tenunara-terracotta/5",
            "border-border",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-tenunara-mint text-tenunara-terracotta">
            <Upload className="h-8 w-8" />
          </div>
          <p className="text-sm font-medium text-tenunara-charcoal">
            Klik atau seret foto kain di sini
          </p>
          <p className="mt-1 text-xs text-tenunara-teal">
            JPG, PNG, atau WebP &middot; Maks 10MB per file
          </p>
        </div>
      )}

      {/* Error */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{errorMessage}</p>
        </div>
      )}
    </div>
  )
}

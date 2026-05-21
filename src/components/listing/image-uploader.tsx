"use client"

import { useState, useRef, type DragEvent } from "react"
import { Upload, Image, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisResult } from "@/lib/types"

// TODO: Replace with real AI analyze API call:
// POST /api/analyze with formData containing the image
async function mockAnalyzeImage(_base64: string): Promise<AnalysisResult> {
  await new Promise((r) => setTimeout(r, 1500))
  return {
    material: "denim",
    dominant_color: "blue",
    size_estimate: "medium",
    condition: "clean",
    grade: "B",
    confidence: 0.87,
  }
}

interface ImageUploaderProps {
  onImageSelected: (base64: string, mimeType: string) => void
  onAnalysisComplete: (result: AnalysisResult) => void
  onAnalysisError: (error: string) => void
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

type UploadState =
  | "idle"
  | "hover"
  | "selected"
  | "analyzing"
  | "complete"
  | "error"
  | "file_too_large"
  | "wrong_type"

export function ImageUploader({
  onImageSelected,
  onAnalysisComplete,
  onAnalysisError,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [isDragOver, setIsDragOver] = useState(false)

  const reset = () => {
    setUploadState("idle")
    setPreviewUrl(null)
    setErrorMessage("")
  }

  const processFile = (file: File) => {
    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadState("wrong_type")
      setErrorMessage("Hanya JPG, PNG, dan WebP yang didukung")
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadState("file_too_large")
      setErrorMessage("Ukuran file maksimal 10MB")
      return
    }

    setUploadState("selected")

    // Read file as base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      setPreviewUrl(base64)
      onImageSelected(base64, file.type)

      // Start "analyzing"
      setUploadState("analyzing")

      mockAnalyzeImage(base64)
        .then((result) => {
          setUploadState("complete")
          onAnalysisComplete(result)
        })
        .catch((err) => {
          setUploadState("error")
          const msg = err instanceof Error ? err.message : "Gagal menganalisis foto"
          setErrorMessage(msg)
          onAnalysisError(msg)
        })
    }
    reader.onerror = () => {
      setUploadState("error")
      setErrorMessage("Gagal membaca file")
      onAnalysisError("Gagal membaca file")
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processFile(file)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => setIsDragOver(false)

  // Retry resets to idle
  const handleRetry = () => {
    reset()
  }

  const isInteractive =
    uploadState === "idle" || uploadState === "hover" || uploadState === "error" || uploadState === "file_too_large" || uploadState === "wrong_type"

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-tenunara-charcoal">Upload Foto Kain</p>

      <div
        onClick={() => {
          if (isInteractive) inputRef.current?.click()
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragOver(false)}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-200",
          isInteractive && "hover:border-tenunara-terracotta hover:bg-tenunara-terracotta/5",
          (uploadState === "selected" || uploadState === "analyzing" || uploadState === "complete") && "pointer-events-none",
          isDragOver && "border-tenunara-terracotta bg-tenunara-terracotta/5",
          uploadState === "idle" && "border-border",
          uploadState === "hover" && "border-tenunara-terracotta bg-tenunara-terracotta/5",
          (uploadState === "error" || uploadState === "file_too_large" || uploadState === "wrong_type") && "border-destructive bg-destructive/5",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Preview thumbnail */}
        {previewUrl && (uploadState === "selected" || uploadState === "analyzing" || uploadState === "complete") && (
          <div className="relative mb-4 h-48 w-full max-w-sm overflow-hidden rounded-2xl">
            <img
              src={previewUrl}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            {/* Overlay on analyzing */}
            {uploadState === "analyzing" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-white">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm font-medium">AI sedang menganalisis foto...</span>
              </div>
            )}
            {/* Overlay on complete */}
            {uploadState === "complete" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-full bg-grade-success/90 px-4 py-2 text-sm font-semibold text-white">
                  <CheckCircle2 className="h-5 w-5" />
                  Analisis selesai
                </div>
              </div>
            )}
          </div>
        )}

        {/* Idle state icon + text */}
        {(uploadState === "idle" || uploadState === "hover") && !previewUrl && (
          <>
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-tenunara-mint text-tenunara-terracotta">
              <Upload className="h-8 w-8" />
            </div>
            <p className="text-sm font-medium text-tenunara-charcoal">
              Klik atau seret foto kain di sini
            </p>
            <p className="mt-1 text-xs text-tenunara-teal">
              JPG, PNG, atau WebP &middot; Maks 10MB
            </p>
          </>
        )}

        {/* Selected (before analysis starts) */}
        {uploadState === "selected" && !previewUrl && (
          <Loader2 className="h-8 w-8 animate-spin text-tenunara-terracotta" />
        )}

        {/* Error states */}
        {(uploadState === "error" || uploadState === "file_too_large" || uploadState === "wrong_type") && (
          <div className="flex flex-col items-center gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-destructive">{errorMessage}</p>
            <button
              onClick={handleRetry}
              className="mt-2 rounded-xl border border-tenunara-terracotta px-5 py-2 text-sm font-semibold text-tenunara-terracotta transition-colors duration-200 hover:bg-tenunara-terracotta/5"
            >
              Coba Lagi
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

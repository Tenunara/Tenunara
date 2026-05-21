"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, Camera, FileText } from "lucide-react"
import { ImageUploader } from "@/components/listing/image-uploader"
import { AIResultDisplay } from "@/components/listing/ai-result-display"
import { ListingForm } from "@/components/listing/listing-form"
import { cn } from "@/lib/utils"
import type { AnalysisResult, Material, Color, SizeEstimate, Condition, Grade } from "@/lib/types"

// TODO: Replace mock with real POST /api/listings call
interface ListingSubmitData {
  title: string
  description?: string
  material: Material
  color: Color
  size_estimate: SizeEstimate
  condition: Condition
  grade: Grade
  quantity_kg: number
  price_per_kg: number
}

async function submitListing(_data: ListingSubmitData): Promise<{ id: string }> {
  await new Promise((r) => setTimeout(r, 1000))
  return { id: "new-listing-" + Date.now() }
}

type Step = "upload" | "review" | "form"

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "upload", label: "Upload Foto", icon: <Camera className="h-4 w-4" /> },
  { key: "review", label: "Review AI", icon: <FileText className="h-4 w-4" /> },
  { key: "form", label: "Lengkapi Data", icon: <Check className="h-4 w-4" /> },
]

export default function NewListingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("upload")
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const stepIndex = STEPS.findIndex((s) => s.key === step)

  const handleImageSelected = (_base64: string, _mimeType: string) => {
    setImageBase64(_base64)
    setAnalysisError(null)
    setAnalysisLoading(true)
  }

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResult(result)
    setAnalysisLoading(false)
    setStep("review")
  }

  const handleAnalysisError = (error: string) => {
    setAnalysisError(error)
    setAnalysisLoading(false)
    setStep("form")
  }

  const handleConfirmAI = () => {
    setStep("form")
  }

  const handleRetake = () => {
    setStep("upload")
    setAnalysisResult(null)
    setImageBase64(null)
    setAnalysisError(null)
  }

  const handleSubmit = async (data: ListingSubmitData) => {
    setIsSubmitting(true)
    try {
      const result = await submitListing(data)
      router.push(`/dashboard/listings/${result.id}`)
    } catch {
      // TODO: Show error toast via sonner
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <button
        onClick={() => {
          if (step === "upload") router.push("/dashboard/listings")
          else if (step === "review") setStep("upload")
          else setStep("review")
        }}
        className="mb-4 flex items-center gap-2 text-sm font-medium text-tenunara-teal transition-colors duration-200 hover:text-tenunara-charcoal"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </button>

      <h1 className="text-2xl font-bold text-tenunara-charcoal">Buat Listing Baru</h1>
      <p className="mt-1 text-sm text-tenunara-teal">
        Upload foto kain untuk analisis AI otomatis
      </p>

      <div className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200",
                i <= stepIndex
                  ? "bg-tenunara-terracotta text-white"
                  : "bg-tenunara-mint/50 text-tenunara-teal",
              )}
            >
              {s.icon}
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn("h-px w-8", i < stepIndex ? "bg-tenunara-terracotta" : "bg-border")}
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-8">
        {step === "upload" && (
          <div className="space-y-6">
            <ImageUploader
              onImageSelected={handleImageSelected}
              onAnalysisComplete={handleAnalysisComplete}
              onAnalysisError={handleAnalysisError}
            />
            {analysisError && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                <p className="text-sm font-medium text-destructive">
                  AI gagal menganalisis foto: {analysisError}
                </p>
                <p className="mt-1 text-xs text-tenunara-teal">
                  Anda akan diarahkan ke form input manual
                </p>
              </div>
            )}
          </div>
        )}

        {step === "review" && (
          <AIResultDisplay
            result={analysisResult}
            isLoading={false}
            onConfirm={handleConfirmAI}
            onRetake={handleRetake}
          />
        )}

        {step === "form" && (
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-lg font-semibold text-tenunara-charcoal">
              {analysisResult ? "Review & Publikasikan" : "Input Manual"}
            </h2>
            <ListingForm
              aiResult={
                analysisResult
                  ? {
                      material: analysisResult.material,
                      dominant_color: analysisResult.dominant_color,
                      size_estimate: analysisResult.size_estimate,
                      condition: analysisResult.condition,
                      grade: analysisResult.grade,
                    }
                  : null
              }
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  )
}

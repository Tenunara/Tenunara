"use client"

import { CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AI_SIZE_RANGE_LABEL,
  DEFECT_TYPE_LABEL,
} from "@/lib/constants"
import type { AIAnalysisResult, Grade } from "@/lib/types"

interface AIResultDisplayProps {
  result: AIAnalysisResult | null
  isLoading: boolean
  onConfirm: () => void
  onRetake: () => void
}

const GRADE_BG: Record<Grade, string> = {
  A: "bg-grade-success/10 text-grade-success",
  B: "bg-grade-warning/10 text-grade-warning",
  C: "bg-grade-info/10 text-grade-info",
}

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("h-4 animate-pulse rounded-lg bg-tenunara-teal/10", className)} />
}

export function AIResultDisplay({ result, isLoading, onConfirm, onRetake }: AIResultDisplayProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <SkeletonLine className="h-5 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonLine className="h-3 w-16" />
              <SkeletonLine className="h-5 w-24" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <SkeletonLine className="h-10 flex-1 rounded-xl" />
          <SkeletonLine className="h-10 w-32 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!result) return null

  const isHighConfidence = result.ai_confidence_score >= 0.6

  // Parse color from "#hex;ColorName" format
  const colorName = result.ai_dominant_color?.split(";")[1] || result.ai_dominant_color || "-"

  const fields: { label: string; value: string }[] = [
    { label: "Warna Dominan", value: colorName },
    { label: "Pola", value: result.ai_pattern || "-" },
    { label: "Estimasi Ukuran", value: AI_SIZE_RANGE_LABEL[result.ai_size_range] || result.ai_size_range || "-" },
  ]

  return (
    <div className="space-y-4 rounded-3xl bg-white p-6 shadow-sm">
      {/* Confidence indicator */}
      <div className="flex items-center gap-2">
        {isHighConfidence ? (
          <CheckCircle2 className="h-5 w-5 text-grade-success" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-grade-warning" />
        )}
        <span
          className={cn(
            "text-sm font-semibold",
            isHighConfidence ? "text-grade-success" : "text-grade-warning",
          )}
        >
          {isHighConfidence
            ? `AI memiliki kepercayaan tinggi (${Math.round(result.ai_confidence_score * 100)}%)`
            : `AI memiliki tingkat kepercayaan rendah (${Math.round(result.ai_confidence_score * 100)}%). Mohon periksa kembali data.`}
        </span>
      </div>

      {/* Detected fields grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {fields.map((f) => (
          <div key={f.label}>
            <p className="text-xs text-tenunara-teal">{f.label}</p>
            <p className="text-sm font-semibold text-tenunara-charcoal">{f.value}</p>
          </div>
        ))}
        <div>
          <p className="text-xs text-tenunara-teal">Grade</p>
          <span
            className={cn(
              "mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold",
              GRADE_BG[result.ai_suggested_grade],
            )}
          >
            Grade {result.ai_suggested_grade}
          </span>
        </div>
      </div>

      {/* AI Reasoning */}
      {result.ai_reasoning && (
        <div className="rounded-xl bg-tenunara-mint/30 p-3">
          <p className="text-xs font-medium text-tenunara-teal mb-1">Alasan AI:</p>
          <p className="text-sm text-tenunara-charcoal">{result.ai_reasoning}</p>
        </div>
      )}

      {/* Defects */}
      {result.defects && result.defects.length > 0 && (
        <div>
          <p className="text-xs font-medium text-tenunara-teal mb-2">Cacat Terdeteksi:</p>
          <div className="space-y-1.5">
            {result.defects.map((d, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
                <span className="text-sm text-tenunara-charcoal">
                  {DEFECT_TYPE_LABEL[d.defect_type] || d.defect_type}
                </span>
                <span className="text-xs text-tenunara-teal">
                  {d.defect_percentage}% area (confidence: {Math.round(d.confidence_score * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-tenunara-terracotta px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-tenunara-terracotta/90"
        >
          Gunakan Hasil AI
        </button>
        <button
          onClick={onRetake}
          className="flex items-center justify-center gap-2 rounded-xl border border-tenunara-teal/20 px-5 py-3 text-sm font-medium text-tenunara-teal transition-colors duration-200 hover:bg-tenunara-teal/5"
        >
          <RefreshCw className="h-4 w-4" />
          Ambil Ulang
        </button>
      </div>
    </div>
  )
}

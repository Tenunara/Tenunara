"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

// TODO: Replace with shadcn Dialog once the full component library is imported
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
// For now, using a simple modal overlay

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: () => void
  confirmLabel?: string
  cancelLabel?: string
  variant?: "default" | "destructive"
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Konfirmasi",
  cancelLabel = "Batal",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  if (!open) return null

  // TODO: Replace this overlay with proper shadcn Dialog component
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-md rounded-3xl bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-tenunara-charcoal">{title}</h3>
        <p className="mt-2 text-sm text-tenunara-teal">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="rounded-xl border border-tenunara-teal/20 px-5 py-2 text-sm font-medium text-tenunara-teal transition-colors duration-200 hover:bg-tenunara-teal/5 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 disabled:opacity-50",
              variant === "destructive"
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-tenunara-terracotta hover:bg-tenunara-terracotta/90"
            )}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

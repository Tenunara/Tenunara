import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="text-tenunara-teal/40">{icon}</div>
      <h3 className="text-lg font-semibold text-tenunara-charcoal">{title}</h3>
      <p className="max-w-sm text-sm text-tenunara-teal">{description}</p>
      {actionLabel && onAction && (
        // TODO: Replace with proper button component once navigation/routing is set up
        <button
          onClick={onAction}
          className="mt-2 rounded-xl bg-tenunara-terracotta px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-tenunara-terracotta/90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

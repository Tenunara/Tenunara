import { AlertCircle } from "lucide-react"

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p className="text-sm text-tenunara-charcoal">{message}</p>
      {onRetry && (
        // TODO: Replace with proper button component once navigation/routing is set up
        <button
          onClick={onRetry}
          className="mt-1 rounded-xl border border-tenunara-terracotta px-5 py-2 text-sm font-semibold text-tenunara-terracotta transition-colors duration-200 hover:bg-tenunara-terracotta/5"
        >
          Coba Lagi
        </button>
      )}
    </div>
  )
}

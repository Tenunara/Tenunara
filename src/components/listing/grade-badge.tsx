import { cn } from "@/lib/utils"
import type { Grade } from "@/lib/types"

interface GradeBadgeProps {
  grade: Grade
  size?: "sm" | "md" | "lg"
}

const gradeStyles: Record<Grade, string> = {
  A: "bg-grade-success/10 text-grade-success border-grade-success/20",
  B: "bg-grade-warning/10 text-grade-warning border-grade-warning/20",
  C: "bg-grade-info/10 text-grade-info border-grade-info/20",
}

const sizeStyles = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
}

export function GradeBadge({ grade, size = "md" }: GradeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-bold tracking-wide",
        gradeStyles[grade],
        sizeStyles[size],
      )}
    >
      Grade {grade}
    </span>
  )
}

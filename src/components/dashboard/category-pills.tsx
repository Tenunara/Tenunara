"use client"

import { cn } from "@/lib/utils"

interface CategoryPillsProps {
  categories: { label: string; value: string; type?: "grade" | "default" }[]
  active: string
  onChange: (value: string) => void
}

const GRADE_COLORS: Record<string, string> = {
  A: "border-[#2E7D32] text-[#2E7D32]",
  B: "border-[#E65100] text-[#E65100]",
  C: "border-[#1565C0] text-[#1565C0]",
}

const GRADE_ACTIVE: Record<string, string> = {
  A: "bg-[#2E7D32] text-white border-[#2E7D32]",
  B: "bg-[#E65100] text-white border-[#E65100]",
  C: "bg-[#1565C0] text-white border-[#1565C0]",
}

export function CategoryPills({ categories, active, onChange }: CategoryPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
      {categories.map((cat) => {
        const isGrade = cat.type === "grade"
        const isActive = active === cat.value
        const gradeKey = cat.label.replace("Grade ", "")

        return (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            className={cn(
              "flex-shrink-0 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200",
              isActive && isGrade && GRADE_ACTIVE[gradeKey],
              isActive && !isGrade && "border-tenunara-terracotta bg-tenunara-terracotta text-white",
              !isActive && isGrade && GRADE_COLORS[gradeKey],
              !isActive && !isGrade && "border-border bg-white text-tenunara-teal hover:border-tenunara-terracotta hover:text-tenunara-terracotta",
            )}
          >
            {cat.label}
          </button>
        )
      })}
    </div>
  )
}

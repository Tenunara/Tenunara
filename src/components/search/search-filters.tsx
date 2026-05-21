"use client"

import { useState } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { MATERIAL_OPTIONS } from "@/lib/constants"
import type { Material, Grade } from "@/lib/types"

export interface FilterState {
  material: Material | null
  grade: Grade | null
  minPricePerKg: number | null
  maxPricePerKg: number | null
  minQuantityKg: number | null
}

interface SearchFiltersProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
}

const defaultFilters: FilterState = {
  material: null,
  grade: null,
  minPricePerKg: null,
  maxPricePerKg: null,
  minQuantityKg: null,
}

const GRADE_OPTIONS: { value: Grade; label: string }[] = [
  { value: "A", label: "Grade A" },
  { value: "B", label: "Grade B" },
  { value: "C", label: "Grade C" },
]

function countActive(f: FilterState): number {
  let n = 0
  if (f.material) n++
  if (f.grade) n++
  if (f.minPricePerKg !== null) n++
  if (f.maxPricePerKg !== null) n++
  if (f.minQuantityKg !== null) n++
  return n
}

export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  const [open, setOpen] = useState(false)
  const activeCount = countActive(filters)

  const set = (key: keyof FilterState, value: string | null) => {
    onChange({ ...filters, [key]: value })
  }

  const clear = () => onChange(defaultFilters)

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-tenunara-teal transition-colors duration-200 hover:bg-tenunara-mint/50"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filter
        {activeCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-tenunara-terracotta px-1.5 text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="mt-3 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-tenunara-charcoal">Filter</h3>
            {activeCount > 0 && (
              <button
                onClick={clear}
                className="flex items-center gap-1 text-xs font-medium text-tenunara-terracotta hover:underline"
              >
                <X className="h-3 w-3" />
                Hapus semua
              </button>
            )}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Material */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-tenunara-teal">Material</p>
              <div className="flex flex-wrap gap-1.5">
                {MATERIAL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      set("material", filters.material === opt.value ? null : opt.value)
                    }
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                      filters.material === opt.value
                        ? "border-tenunara-terracotta bg-tenunara-terracotta/5 text-tenunara-terracotta"
                        : "border-border text-tenunara-teal hover:bg-tenunara-mint/50",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grade */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-tenunara-teal">Grade</p>
              <div className="flex flex-wrap gap-1.5">
                {GRADE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      set("grade", filters.grade === opt.value ? null : opt.value)
                    }
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
                      filters.grade === opt.value
                        ? "border-tenunara-terracotta bg-tenunara-terracotta/5 text-tenunara-terracotta"
                        : "border-border text-tenunara-teal hover:bg-tenunara-mint/50",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-tenunara-teal">Harga per kg (Rp)</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  min={0}
                  value={filters.minPricePerKg ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      minPricePerKg: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border border-border px-3 py-1.5 text-xs text-tenunara-charcoal placeholder:text-tenunara-teal/40 focus:border-tenunara-terracotta focus:outline-none"
                />
                <span className="text-xs text-tenunara-teal/60">&ndash;</span>
                <input
                  type="number"
                  placeholder="Max"
                  min={0}
                  value={filters.maxPricePerKg ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      maxPricePerKg: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full rounded-lg border border-border px-3 py-1.5 text-xs text-tenunara-charcoal placeholder:text-tenunara-teal/40 focus:border-tenunara-terracotta focus:outline-none"
                />
              </div>
            </div>

            {/* Min quantity */}
            <div>
              <p className="mb-1.5 text-xs font-medium text-tenunara-teal">Min. jumlah (kg)</p>
              <input
                type="number"
                placeholder="0"
                min={0}
                value={filters.minQuantityKg ?? ""}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    minQuantityKg: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full rounded-lg border border-border px-3 py-1.5 text-xs text-tenunara-charcoal placeholder:text-tenunara-teal/40 focus:border-tenunara-terracotta focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

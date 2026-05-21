"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  MATERIAL_OPTIONS,
  COLOR_OPTIONS,
  SIZE_OPTIONS,
  CONDITION_OPTIONS,
  GRADE_BG,
} from "@/lib/constants"
import type { Grade, Material, Color, SizeEstimate, Condition, Listing } from "@/lib/types"

interface ListingFormProps {
  initialData?: Partial<Listing>
  aiResult?: {
    material: Material
    dominant_color: Color
    size_estimate: SizeEstimate
    condition: Condition
    grade: Grade
  } | null
  onSubmit: (data: {
    title: string
    description?: string
    material: Material
    color: Color
    size_estimate: SizeEstimate
    condition: Condition
    grade: Grade
    quantity_kg: number
    price_per_kg: number
  }) => Promise<void>
  isSubmitting: boolean
}

function calculateGrade(size: SizeEstimate | null, condition: Condition | null): Grade {
  if (size === "large" && condition === "clean") return "A"
  if (size === "medium" || (size === "large" && condition === "slightly_worn")) return "B"
  return "C"
}

export function ListingForm({ initialData, aiResult, onSubmit, isSubmitting }: ListingFormProps) {
  const [title, setTitle] = useState(initialData?.title || aiResult ? "" : "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [material, setMaterial] = useState<Material | null>(
    initialData?.material || aiResult?.material || null,
  )
  const [color, setColor] = useState<Color | null>(
    initialData?.color || aiResult?.dominant_color || null,
  )
  const [sizeEstimate, setSizeEstimate] = useState<SizeEstimate | null>(
    initialData?.size_estimate || aiResult?.size_estimate || null,
  )
  const [condition, setCondition] = useState<Condition | null>(
    initialData?.condition || aiResult?.condition || null,
  )
  const [quantityKg, setQuantityKg] = useState(initialData?.quantity_kg?.toString() || "")
  const [pricePerKg, setPricePerKg] = useState(initialData?.price_per_kg?.toString() || "")
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pre-fill from AI result when it becomes available
  useEffect(() => {
    if (aiResult) {
      setMaterial(aiResult.material)
      setColor(aiResult.dominant_color)
      setSizeEstimate(aiResult.size_estimate)
      setCondition(aiResult.condition)
    }
  }, [aiResult])

  // Auto-calculate grade when size or condition changes
  const grade: Grade = calculateGrade(sizeEstimate, condition)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!title || title.length < 10) errs.title = "Judul minimal 10 karakter"
    if (title.length > 200) errs.title = "Judul maksimal 200 karakter"
    if (!material) errs.material = "Pilih material"
    if (!color) errs.color = "Pilih warna"
    if (!sizeEstimate) errs.sizeEstimate = "Pilih estimasi ukuran"
    if (!condition) errs.condition = "Pilih kondisi"
    if (!quantityKg || Number(quantityKg) <= 0 || Number(quantityKg) > 99999)
      errs.quantityKg = "Jumlah harus antara 1 - 99.999 kg"
    if (pricePerKg === "" || Number(pricePerKg) < 0) errs.pricePerKg = "Harga tidak boleh negatif"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (!material || !color || !sizeEstimate || !condition) return

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      material,
      color,
      size_estimate: sizeEstimate,
      condition,
      grade,
      quantity_kg: Number(quantityKg),
      price_per_kg: Number(pricePerKg),
    })
  }

  const selectClass = (hasError: boolean) =>
    cn(hasError && "border-destructive ring-1 ring-destructive")

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Judul Listing <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Contoh: Limbah Denim Biru 80kg"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
        <p className="text-xs text-tenunara-teal/60">{title.length}/200 karakter</p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Deskripsi</Label>
        <Textarea
          id="description"
          placeholder="Jelaskan kondisi dan detail kain... (opsional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          className="min-h-[80px] resize-none"
        />
        <p className="text-xs text-tenunara-teal/60">{description.length}/500 karakter</p>
      </div>

      {/* Material + Color row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            Material <span className="text-destructive">*</span>
          </Label>
          <Select
            value={material || ""}
            onValueChange={(v) => setMaterial(v as Material)}
          >
            <SelectTrigger className={selectClass(!!errors.material)}>
              <SelectValue placeholder="Pilih material" />
            </SelectTrigger>
            <SelectContent>
              {MATERIAL_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.material && <p className="text-xs text-destructive">{errors.material}</p>}
        </div>
        <div className="space-y-2">
          <Label>
            Warna <span className="text-destructive">*</span>
          </Label>
          <Select value={color || ""} onValueChange={(v) => setColor(v as Color)}>
            <SelectTrigger className={selectClass(!!errors.color)}>
              <SelectValue placeholder="Pilih warna" />
            </SelectTrigger>
            <SelectContent>
              {COLOR_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.color && <p className="text-xs text-destructive">{errors.color}</p>}
        </div>
      </div>

      {/* Size + Condition row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            Ukuran <span className="text-destructive">*</span>
          </Label>
          <Select
            value={sizeEstimate || ""}
            onValueChange={(v) => setSizeEstimate(v as SizeEstimate)}
          >
            <SelectTrigger className={selectClass(!!errors.sizeEstimate)}>
              <SelectValue placeholder="Pilih ukuran" />
            </SelectTrigger>
            <SelectContent>
              {SIZE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sizeEstimate && (
            <p className="text-xs text-destructive">{errors.sizeEstimate}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>
            Kondisi <span className="text-destructive">*</span>
          </Label>
          <Select
            value={condition || ""}
            onValueChange={(v) => setCondition(v as Condition)}
          >
            <SelectTrigger className={selectClass(!!errors.condition)}>
              <SelectValue placeholder="Pilih kondisi" />
            </SelectTrigger>
            <SelectContent>
              {CONDITION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.condition && <p className="text-xs text-destructive">{errors.condition}</p>}
        </div>
      </div>

      {/* Grade (read-only, auto-calculated) */}
      <div className="space-y-2">
        <Label>Grade (otomatis)</Label>
        <div className="rounded-xl border border-border bg-tenunara-mint/30 px-4 py-3">
          <span
            className={cn(
              "inline-block rounded-full px-3 py-1 text-sm font-bold",
              GRADE_BG[grade],
            )}
          >
            Grade {grade}
          </span>
          <p className="mt-1 text-xs text-tenunara-teal">
            Grade dihitung otomatis berdasarkan ukuran dan kondisi
          </p>
        </div>
      </div>

      {/* Quantity + Price row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">
            Jumlah (kg) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            max={99999}
            placeholder="1"
            value={quantityKg}
            onChange={(e) => setQuantityKg(e.target.value)}
            required
          />
          {errors.quantityKg && <p className="text-xs text-destructive">{errors.quantityKg}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">
            Harga per kg (Rp) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="price"
            type="number"
            min={0}
            placeholder="10000"
            value={pricePerKg}
            onChange={(e) => setPricePerKg(e.target.value)}
            required
          />
          {errors.pricePerKg && (
            <p className="text-xs text-destructive">{errors.pricePerKg}</p>
          )}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-tenunara-terracotta py-3.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-tenunara-terracotta/90"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Mempublikasikan...
          </span>
        ) : (
          "Publikasikan"
        )}
      </Button>
    </form>
  )
}

import type { Color, Condition, DisputeReason, Grade, Material, SizeEstimate, TransactionStatus } from "./types"

export const MATERIAL_OPTIONS: { value: Material; label: string }[] = [
  { value: "denim", label: "Denim" },
  { value: "cotton", label: "Katun" },
  { value: "polyester", label: "Polyester" },
  { value: "mixed", label: "Campuran" },
  { value: "other", label: "Lainnya" },
]

export const COLOR_OPTIONS: { value: Color; label: string }[] = [
  { value: "blue", label: "Biru" },
  { value: "black", label: "Hitam" },
  { value: "white", label: "Putih" },
  { value: "red", label: "Merah" },
  { value: "green", label: "Hijau" },
  { value: "yellow", label: "Kuning" },
  { value: "brown", label: "Coklat" },
  { value: "grey", label: "Abu-abu" },
  { value: "orange", label: "Oranye" },
  { value: "purple", label: "Ungu" },
  { value: "pink", label: "Merah Muda" },
  { value: "multicolor", label: "Multi-warna" },
]

export const SIZE_OPTIONS: { value: SizeEstimate; label: string }[] = [
  { value: "small", label: "Kecil (<20cm)" },
  { value: "medium", label: "Sedang (20-40cm)" },
  { value: "large", label: "Besar (>40cm)" },
]

export const CONDITION_OPTIONS: { value: Condition; label: string }[] = [
  { value: "clean", label: "Bersih" },
  { value: "slightly_worn", label: "Sedikit Usang" },
  { value: "stained", label: "Bernoda" },
  { value: "mixed", label: "Campuran" },
]

export const STATUS_FLOW: TransactionStatus[] = [
  "pending",
  "escrow_held",
  "shipped",
  "delivered",
  "completed",
]

export const DISPUTE_REASON_OPTIONS: { value: DisputeReason; label: string }[] = [
  { value: "material_not_match", label: "Material tidak sesuai" },
  { value: "grade_different", label: "Grade berbeda dengan deskripsi" },
  { value: "quantity_insufficient", label: "Jumlah kurang" },
  { value: "poor_condition", label: "Kondisi buruk" },
  { value: "other", label: "Lainnya" },
]

// Material label lookup
export const MATERIAL_LABEL: Record<string, string> = Object.fromEntries(
  MATERIAL_OPTIONS.map((o) => [o.value, o.label])
)

// Grade → color mapping
export const GRADE_BG: Record<Grade, string> = {
  A: "bg-grade-success/10 text-grade-success",
  B: "bg-grade-warning/10 text-grade-warning",
  C: "bg-grade-info/10 text-grade-info",
}

export const GRADE_TEXT: Record<Grade, string> = {
  A: "text-grade-success",
  B: "text-grade-warning",
  C: "text-grade-info",
}

// Color → Indonesian label
export const COLOR_LABEL: Record<string, string> = Object.fromEntries(
  COLOR_OPTIONS.map((o) => [o.value, o.label])
)

// Condition label lookup
export const CONDITION_LABEL: Record<string, string> = Object.fromEntries(
  CONDITION_OPTIONS.map((o) => [o.value, o.label])
)

// Size label lookup
export const SIZE_LABEL: Record<string, string> = Object.fromEntries(
  SIZE_OPTIONS.map((o) => [o.value, o.label])
)

// ============================================================
// PRODUCT CONSTANTS (for new product schema)
// ============================================================

export const PRODUCTION_SOURCE_LABEL: Record<string, string> = {
  sisa_pola: "Sisa Potongan Pola",
  cacat_maklun: "Cacat Maklun",
  akhir_roll: "Akhir Roll",
}

export const HYGIENE_STATUS_LABEL: Record<string, string> = {
  clean_washed: "Bersih (Sudah Dicuci)",
  clean_fresh_cut: "Bersih (Sisa Potongan Baru)",
  dusty: "Berdebu",
}

export const AI_SIZE_RANGE_LABEL: Record<string, string> = {
  lt15cm: "<15 cm (Kecil)",
  "15-30cm": "15-30 cm (Kecil)",
  "30-50cm": "30-50 cm (Sedang)",
  gt50cm: ">50 cm (Besar)",
}

export const DEFECT_TYPE_LABEL: Record<string, string> = {
  noda: "Noda Oli Mesin",
  sobek: "Sobekan / Lubang",
  lubang: "Lubang",
  warna_pudar: "Warna Pudar",
  cacat_tenun: "Cacat Tenun",
}

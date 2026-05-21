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

// ============================================================
// ORDER CONSTANTS
// ============================================================

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending_payment: "Menunggu Pembayaran",
  awaiting_shipment: "Menunggu Pengiriman",
  in_verification: "Dalam Verifikasi",
  completed: "Selesai",
  dispute: "Sengketa",
  cancelled: "Dibatalkan",
}

export const ORDER_STATUS_COLOR: Record<string, string> = {
  pending_payment: "bg-grade-warning/10 text-grade-warning",
  awaiting_shipment: "bg-blue-100 text-blue-700",
  in_verification: "bg-purple-100 text-purple-700",
  completed: "bg-grade-success/10 text-grade-success",
  dispute: "bg-destructive/10 text-destructive",
  cancelled: "bg-tenunara-teal/10 text-tenunara-teal",
}

export const ORDER_STATUS_BG: Record<string, string> = {
  pending_payment: "bg-grade-warning/5 border-grade-warning/20",
  awaiting_shipment: "bg-blue-50/5 border-blue-200/20",
  in_verification: "bg-purple-50/5 border-purple-200/20",
  completed: "bg-grade-success/5 border-grade-success/20",
  dispute: "bg-destructive/5 border-destructive/20",
  cancelled: "bg-tenunara-teal/5 border-tenunara-teal/20",
}

export const ORDER_DISPUTE_REASON_OPTIONS: { value: string; label: string }[] = [
  { value: "quality_not_match", label: "Kualitas Tidak Sesuai" },
  { value: "grade_different", label: "Grade Berbeda" },
  { value: "wrong_material", label: "Bahan Salah" },
  { value: "damaged", label: "Rusak" },
  { value: "quantity_insufficient", label: "Jumlah Kurang" },
  { value: "other", label: "Lainnya" },
]

export const ORDER_DISPUTE_REASON_LABEL: Record<string, string> = Object.fromEntries(
  ORDER_DISPUTE_REASON_OPTIONS.map((o) => [o.value, o.label]),
)

export const RESOLUTION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "refund", label: "Refund" },
  { value: "price_adjustment", label: "Penyesuaian Harga" },
  { value: "return", label: "Retur" },
  { value: "other", label: "Lainnya" },
]

export const RESOLUTION_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  RESOLUTION_TYPE_OPTIONS.map((o) => [o.value, o.label]),
)

export const ORDER_DISPUTE_STATUS_LABEL: Record<string, string> = {
  open: "Menunggu",
  resolved: "Selesai",
  rejected: "Ditolak",
}

// Timeline order for the stepper component
export const ORDER_STATUS_FLOW: string[] = [
  "pending_payment",
  "awaiting_shipment",
  "in_verification",
  "completed",
]

// ─── Shipping / Payment Options ───────────────────────────────

export const SHIPPING_OPTIONS: { value: string; label: string; cost: number }[] = [
  { value: "jne", label: "JNE", cost: 12000 },
  { value: "jnt", label: "J&T Express", cost: 11000 },
  { value: "sicepat", label: "SiCepat Ekspres", cost: 13000 },
  { value: "anteraja", label: "Anteraja", cost: 10000 },
  { value: "ninja_xpress", label: "Ninja Xpress", cost: 12500 },
]

export const SHIPPING_OPTION_LABEL: Record<string, string> = Object.fromEntries(
  SHIPPING_OPTIONS.map((o) => [o.value, o.label]),
)

export const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: "ewallet", label: "Dompet Digital (E-Wallet)" },
  { value: "qris", label: "QRIS" },
  { value: "virtual_account", label: "Virtual Account" },
  { value: "transfer_bank", label: "Transfer Bank Langsung" },
]

export const PAYMENT_METHOD_LABEL: Record<string, string> = Object.fromEntries(
  PAYMENT_METHODS.map((o) => [o.value, o.label]),
)

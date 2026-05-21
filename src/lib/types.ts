// ============================================================
// ENUMS
// ============================================================
export type UserRole = "seller" | "buyer"
export type Material = "denim" | "cotton" | "polyester" | "mixed" | "other"
export type Color =
  | "blue"
  | "black"
  | "white"
  | "red"
  | "green"
  | "yellow"
  | "brown"
  | "grey"
  | "orange"
  | "purple"
  | "pink"
  | "multicolor"
export type SizeEstimate = "small" | "medium" | "large"
export type Condition = "clean" | "slightly_worn" | "stained" | "mixed"
export type Grade = "A" | "B" | "C"
export type ListingStatus = "active" | "sold" | "archived"
export type TransactionStatus =
  | "pending"
  | "escrow_held"
  | "shipped"
  | "delivered"
  | "completed"
  | "disputed"
  | "refunded"
export type DisputeReason =
  | "material_not_match"
  | "grade_different"
  | "quantity_insufficient"
  | "poor_condition"
  | "other"
export type DisputeStatus = "open" | "resolved"

// ============================================================
// DATABASE ROW INTERFACES
// ============================================================
export interface Profile {
  id: string
  name: string
  role: UserRole
  company: string | null
  created_at: string
}

export interface Listing {
  id: string
  seller_id: string
  title: string
  description: string | null
  material: Material
  color: Color
  size_estimate: SizeEstimate
  condition: Condition
  grade: Grade
  quantity_kg: number
  price_per_kg: number
  image_url: string | null
  status: ListingStatus
  created_at: string
}

export interface Transaction {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  quantity_kg: number
  total_price: number
  status: TransactionStatus
  inspection_deadline: string | null
  created_at: string
}

export interface Dispute {
  id: string
  transaction_id: string
  raised_by: string
  reason: DisputeReason
  description: string
  image_url: string | null
  status: DisputeStatus
  resolution: string | null
  created_at: string
}

export interface ESGRecord {
  id: string
  user_id: string
  date: string
  waste_diverted_kg: number
  co2_saved_kg: number
  transaction_count: number
}

// ============================================================
// API RESPONSE TYPES
// ============================================================
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface SingleResponse<T> {
  data: T
}

export interface ErrorResponse {
  error: string
  details?: string
}

export interface AnalysisResult {
  material: Material
  dominant_color: Color
  size_estimate: SizeEstimate
  condition: Condition
  grade: Grade
  confidence: number
}

export interface ESGSummary {
  total_waste_kg: number
  total_co2_kg: number
  total_transactions: number
  trees_equivalent: number
}

export interface ESGResponse {
  records: ESGRecord[]
  summary: ESGSummary
}

export interface SearchResultItem {
  id: string
  title: string
  material: Material
  color: Color
  grade: Grade
  quantity_kg: number
  price_per_kg: number
  image_url: string | null
  seller_name: string
  seller_company: string | null
  similarity: number
  created_at: string
}

// ============================================================
// COMPOSITE TYPES (joins used in UI)
// ============================================================
export interface ListingWithSeller extends Listing {
  seller_name: string
  seller_company: string | null
}

export interface TransactionDetail extends Transaction {
  listing: Pick<Listing, "id" | "title" | "material" | "color" | "grade" | "image_url" | "description">
  buyer: Profile
  seller: Profile
  dispute?: Dispute
}

// ============================================================
// FORM REQUEST TYPES
// ============================================================
export interface CreateListingRequest {
  title: string
  description?: string
  material: Material
  color: Color
  size_estimate: SizeEstimate
  condition: Condition
  grade: Grade
  quantity_kg: number
  price_per_kg: number
  image_base64?: string
}

export interface CreateTransactionRequest {
  listing_id: string
  quantity_kg: number
}

export interface CreateDisputeRequest {
  transaction_id: string
  reason: DisputeReason
  description: string
  image_base64?: string
}

export interface SearchRequest {
  query: string
  filters?: {
    material?: Material | null
    grade?: Grade | null
    minPricePerKg?: number | null
    maxPricePerKg?: number | null
    minQuantityKg?: number | null
  }
  limit?: number
}

// ============================================================
// AUTH & PROFILE TYPES
// ============================================================
export interface PengrajinRow {
  id: string
  nama: string
  email: string
  nomor_telepon: string
  foto_profil_url: string | null
  kota: string
  kabupaten: string
  alamat: string
  created_at: string
  updated_at: string
}

export interface UmkmRow {
  id: string
  nama_penjual: string
  nama_toko: string
  email: string
  nomor_telepon: string
  foto_profil_url: string | null
  kota: string
  kabupaten: string
  alamat: string
  npwp_nib: string | null
  created_at: string
  updated_at: string
}

export interface RegisterPengrajinRequest {
  nama: string
  email: string
  nomor_telepon: string
  password: string
  foto_profil_base64?: string
  kota: string
  kabupaten: string
  alamat: string
}

export interface RegisterUmkmRequest {
  nama_penjual: string
  nama_toko: string
  email: string
  nomor_telepon: string
  password: string
  foto_profil_base64?: string
  kota: string
  kabupaten: string
  alamat: string
  npwp_nib?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    role: UserRole
  }
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
  profile: PengrajinRow | UmkmRow
}

// ============================================================
// ENUMS (continued)
// ============================================================
export type UserRole = "seller" | "buyer" | "pengrajin" | "umkm"
export type ProductionSource = "sisa_pola" | "cacat_maklun" | "akhir_roll"
export type HygieneStatus = "clean_washed" | "clean_fresh_cut" | "dusty"
export type FabricCategory = "natural" | "synthetic" | "blend"
export type AiPattern = "polos" | "motif" | "batik" | "stripes" | "checked" | "other"
export type AiSizeRange = "lt15cm" | "15-30cm" | "30-50cm" | "gt50cm"
export type DefectType = "noda" | "sobek" | "lubang" | "warna_pudar" | "cacat_tenun"
export type ProductStatus = "draft" | "pending_review" | "published" | "sold" | "dispute" | "archived"
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

// ============================================================
// PRODUCT TYPES
// ============================================================
export interface FabricType {
  id: number
  name: string
  category: FabricCategory
  common_uses: string | null
}

export interface ProductRow {
  id: string
  umkm_id: string
  fabric_type_id: number
  fiber_composition: string | null
  images_url: string[]
  production_source: ProductionSource
  hygiene_status: HygieneStatus
  has_odor: boolean
  total_weight_kg: number
  estimated_pieces: number | null
  price_per_kg: number
  is_negotiable: boolean
  minimum_order_kg: number | null
  notes: string | null
  ai_dominant_color: string | null
  ai_pattern: AiPattern | null
  ai_size_range: string | null
  ai_confidence_score: number | null
  ai_suggested_grade: Grade | null
  ai_reasoning: string | null
  ai_model_version: string | null
  ai_processed_at: string | null
  final_grade: Grade | null
  is_grade_overridden: boolean
  status: ProductStatus
  created_at: string
  updated_at: string
}

export interface ProductDefectDetail {
  id: number
  product_id: string
  defect_type: DefectType
  defect_percentage: number
  confidence_score: number
  detected_at: string
}

export interface ProductWithFabric extends ProductRow {
  fabric_name: string
  fabric_category: FabricCategory
  umkm_name: string
  umkm_kota: string
  defects: ProductDefectDetail[]
}

export interface CreateProductRequest {
  fabric_type_id: number
  fiber_composition?: string
  production_source: ProductionSource
  hygiene_status: HygieneStatus
  has_odor?: boolean
  total_weight_kg: number
  estimated_pieces?: number
  price_per_kg: number
  is_negotiable?: boolean
  minimum_order_kg?: number
  notes?: string
  status?: ProductStatus
  // Overridable AI fields
  final_grade?: Grade
  // Images as base64 strings (min 1, max 5)
  images_base64: string[]
}

export interface UpdateProductRequest {
  fabric_type_id?: number
  fiber_composition?: string
  production_source?: ProductionSource
  hygiene_status?: HygieneStatus
  has_odor?: boolean
  total_weight_kg?: number
  estimated_pieces?: number
  price_per_kg?: number
  is_negotiable?: boolean
  minimum_order_kg?: number
  notes?: string
  status?: ProductStatus
  final_grade?: Grade
  is_grade_overridden?: boolean
}

export interface AIAnalysisResult {
  images_url: string[]
  ai_dominant_color: string
  ai_pattern: AiPattern
  ai_size_range: string
  ai_confidence_score: number
  ai_suggested_grade: Grade
  ai_reasoning: string
  ai_model_version: string
  ai_processed_at: string
  defects: {
    defect_type: DefectType
    defect_percentage: number
    confidence_score: number
  }[]
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
// ORDER TYPES
// ============================================================
export type OrderStatus =
  | "pending_payment"
  | "awaiting_shipment"
  | "in_verification"
  | "completed"
  | "dispute"
  | "cancelled"

export type OrderDisputeReason =
  | "quality_not_match"
  | "grade_different"
  | "wrong_material"
  | "damaged"
  | "quantity_insufficient"
  | "other"

export type OrderDisputeStatus = "open" | "resolved" | "rejected"

export type ResolutionType = "refund" | "price_adjustment" | "return" | "other"

export type EscrowStatus = "held" | "released" | "refunded"

export type ReservationStatus = "active" | "released" | "consumed"

export interface OrderRow {
  id: string
  order_number: string
  pengrajin_id: string
  umkm_id: string
  status: OrderStatus
  subtotal: number
  shipping_cost: number
  app_fee: number
  grand_total: number
  notes: string | null
  courier_name: string | null
  tracking_number: string | null
  payment_simulated_at: string | null
  confirmed_by_seller_at: string | null
  confirmed_by_buyer_at: string | null
  escrow_release_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: number
  order_id: string
  product_id: string
  quantity_kg: number
  price_per_kg: number
  subtotal: number
  created_at: string
}

export interface OrderStatusHistory {
  id: number
  order_id: string
  from_status: string | null
  to_status: string
  changed_by: string | null
  notes: string | null
  created_at: string
}

export interface StockReservation {
  id: number
  product_id: string
  order_id: string
  reserved_kg: number
  status: ReservationStatus
  expires_at: string
  created_at: string
}

export interface EscrowTransaction {
  id: number
  order_id: string
  amount: number
  status: EscrowStatus
  held_at: string
  released_at: string | null
  refunded_at: string | null
}

export interface OrderDisputeRow {
  id: string
  order_id: string
  raised_by: string
  dispute_reason: OrderDisputeReason
  description: string
  image_urls: string[]
  status: OrderDisputeStatus
  resolution: string | null
  resolution_type: ResolutionType | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface WasteDiversionLog {
  id: number
  order_id: string
  umkm_id: string
  total_weight_kg: number
  logged_at: string
}

// ============================================================
// ORDER COMPOSITE TYPES
// ============================================================
export interface OrderWithDetails extends OrderRow {
  items: OrderItemWithProduct[]
  status_history: OrderStatusHistory[]
  escrow: EscrowTransaction | null
  dispute: OrderDisputeRow | null
  waste_log: WasteDiversionLog | null
  pengrajin: Pick<PengrajinRow, "nama" | "email" | "nomor_telepon" | "kota" | "kabupaten" | "alamat" | "foto_profil_url"> | null
  umkm: Pick<UmkmRow, "nama_penjual" | "nama_toko" | "email" | "nomor_telepon" | "kota" | "kabupaten" | "alamat" | "foto_profil_url"> | null
}

export interface OrderItemWithProduct extends OrderItem {
  product: Pick<ProductRow, "id" | "images_url" | "final_grade" | "fabric_type_id"> & {
    fabric_name?: string
  }
}

export interface OrderListItem extends OrderRow {
  items_count: number
  total_weight_kg: number
  first_product_image: string | null
  pengrajin_name: string | null
  umkm_name: string | null
  dispute_id: string | null
}

// ============================================================
// ORDER REQUEST TYPES
// ============================================================
export interface CreateOrderRequest {
  items: {
    product_id: string
    quantity_kg: number
  }[]
  notes?: string
  shipping_option?: string
  payment_method?: string
}

export interface CreateDisputeRequest {
  dispute_reason: OrderDisputeReason
  description: string
  images_base64?: string[]
}

export interface ResolveDisputeRequest {
  resolution: string
  resolution_type: ResolutionType
  action: "complete" | "cancel"
}

export interface SimulatePaymentRequest {
  /* no fields — payment is a simulated action */
}

export interface ConfirmShipmentRequest {
  courier_name?: string
  tracking_number?: string
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

// ============================================================
// SEMANTIC SEARCH TYPES
// ============================================================
export interface SemanticSearchResult {
  product_id:        string;
  umkm_id:           string;
  nama_toko:         string;
  fabric_type_name:  string;
  fabric_category:   string;
  final_grade:       Grade;
  total_weight_kg:   number;
  price_per_kg:      number;
  minimum_order_kg:  number | null;
  ai_dominant_color: string;
  ai_size_range:     string;
  ai_pattern:        string;
  kota:              string;
  kabupaten:         string;
  is_negotiable:     boolean;
  final_score:       number;
  score_breakdown: {
    semantic:     number;
    hard_filter:  number;
    geo:          number;
    price:        number;
  };
}

export interface ParsedQuery {
  fabric_type?:      string | null;
  fabric_category?:  string | null;
  color?:            string | null;
  min_weight_kg?:    number | null;
  grade?:            string | null;
  search_text:       string;
}

// ============================================================
// UMKM DASHBOARD TYPES
// ============================================================

export type SkalaUsaha = "mikro" | "kecil" | "menengah"
export type VerificationStatus = "menunggu_penjemputan" | "dalam_perjalanan" | "terverifikasi_match" | "dibatalkan" | "sengketa"

export interface DashboardProfile {
  id: string
  nama_penjual: string
  nama_toko: string
  email: string
  nomor_telepon: string
  foto_profil_url: string | null
  npwp_nib: string | null
  skala_usaha: SkalaUsaha | null
  kota: string
  kabupaten: string
  alamat: string
}

export interface DashboardMetrics {
  total_waste_generated_kg: number
  total_waste_diverted_kg: number
  landfill_diversion_rate: number
  waste_to_disposal_kg: number
}

export interface DashboardDistribution {
  upcycle_volume_kg: number
  recycle_volume_kg: number
  active_partner_count: number
}

export interface DashboardImpact {
  co2e_avoided_kg: number
  local_economic_multiplier: number
}

export interface DashboardTrend {
  month: string
  waste_generated_kg: number
  waste_diverted_kg: number
}

export interface DashboardTransaction {
  transaction_id: string
  timestamp: string
  material_type: string
  grade: string
  weight_kg: number
  price_per_kg: number
  subtotal: number
  receiver_name: string
  receiver_id: string
  verification_status: VerificationStatus
  hash_code: string
  order_id: string
  order_number: string
}

export interface DashboardGovernance {
  auditor_log: string
}

export interface UmkmDashboardResponse {
  profile: DashboardProfile
  metrics: DashboardMetrics
  distribution: DashboardDistribution
  impact: DashboardImpact
  trend: DashboardTrend[]
  transactions: DashboardTransaction[]
  governance: DashboardGovernance
}

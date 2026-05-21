import type {
  ProductRow,
  ProductWithFabric,
  ProductDefectDetail,
  FabricType,
  AIAnalysisResult,
  PaginatedResponse,
  SingleResponse,
  CreateProductRequest,
  UpdateProductRequest,
  ListingWithSeller,
  ListingStatus,
  Material,
  Color,
  SizeEstimate,
  Condition,
  Grade,
  OrderListItem,
  OrderWithDetails,
  OrderRow,
  OrderDisputeRow,
  CreateOrderRequest,
  CreateDisputeRequest,
  ResolveDisputeRequest,
  ConfirmShipmentRequest,
  SemanticSearchResult,
  ParsedQuery,
} from "./types";
import { AI_SIZE_RANGE_LABEL } from "./constants";

// ─── Helpers ─────────────────────────────────────────────────────────

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("sb-access-token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Color helpers ───────────────────────────────────────────────────

const COLOR_HEX_MAP: Record<string, Color> = {
  blue: "blue",
  navy: "blue",
  hitam: "black",
  putih: "white",
  merah: "red",
  hijau: "green",
  kuning: "yellow",
  coklat: "brown",
  abu: "grey",
  grey: "grey",
  gray: "grey",
  oranye: "orange",
  orange: "orange",
  ungu: "purple",
  purple: "purple",
  pink: "pink",
  maroon: "red",
  krem: "white",
  biru: "blue",
};

function extractColorFromHex(hexColor: string | null): Color {
  if (!hexColor) return "multicolor";
  // Format from AI: "#hex;ColorName"
  const parts = hexColor.split(";");
  const name = parts[1]?.toLowerCase().trim() || "";
  return COLOR_HEX_MAP[name] || "multicolor";
}

const FABRIC_TO_MATERIAL: Record<string, Material> = {
  "katun combed": "cotton",
  "katun carded": "cotton",
  denim: "denim",
  rayon: "cotton",
  polyester: "polyester",
  drill: "cotton",
  spandex: "cotton",
  nylon: "polyester",
  kanvas: "cotton",
  sutra: "cotton",
  wol: "cotton",
  linen: "cotton",
  "cvc (cotton viscose)": "cotton",
  "tc (tetoron cotton)": "cotton",
  "cotton polyester": "cotton",
};

function mapFabricToMaterial(fabricName: string | undefined): Material {
  const key = fabricName?.toLowerCase().trim() || "";
  return FABRIC_TO_MATERIAL[key] || "other";
}

const SIZE_RANGE_MAP: Record<string, SizeEstimate> = {
  lt15cm: "small",
  "15-30cm": "small",
  "30-50cm": "medium",
  gt50cm: "large",
};

function mapSizeRange(range: string | null): SizeEstimate {
  if (!range) return "medium";
  return SIZE_RANGE_MAP[range] || "medium";
}

function mapProductStatus(status: string): ListingStatus {
  if (status === "published") return "active";
  if (status === "sold") return "sold";
  return "archived";
}

// ─── Product → ListingWithSeller mapper ─────────────────────────────

export function productToListing(
  product: ProductRow | ProductWithFabric,
  sellerName?: string,
  sellerCompany?: string | null,
): ListingWithSeller {
  const images = (product as any).images_url || [];
  const fabricName = (product as any).fabric_name || "Kain";
  const isProductWithFabric =
    "fabric_name" in product || "umkm_name" in product;

  return {
    id: product.id,
    seller_id: product.umkm_id,
    title: `${fabricName} ${product.total_weight_kg}kg`,
    description: (product as any).notes || null,
    material: mapFabricToMaterial(fabricName),
    color: extractColorFromHex(product.ai_dominant_color),
    size_estimate: mapSizeRange(product.ai_size_range),
    condition: "clean" as Condition,
    grade: (product.final_grade || product.ai_suggested_grade || "B") as Grade,
    quantity_kg: product.total_weight_kg,
    price_per_kg: product.price_per_kg,
    image_url: Array.isArray(images) && images.length > 0 ? images[0] : null,
    status: mapProductStatus(product.status),
    created_at: product.created_at,
    seller_name: (product as any).umkm_name || sellerName || "",
    seller_company: (product as any).umkm_kota || sellerCompany || null,
  };
}

// ─── API Functions ───────────────────────────────────────────────────

export async function fetchFabricTypes(): Promise<FabricType[]> {
  const res = await fetchJson<{ data: FabricType[] }>("/api/fabric-types");
  return res.data;
}

export async function fetchMyProducts(
  umkmId: string,
): Promise<ListingWithSeller[]> {
  const res = await fetchJson<PaginatedResponse<ProductRow>>(
    `/api/products?umkm_id=${umkmId}&limit=50`,
  );
  return (res.data || []).map((p) => productToListing(p));
}

export async function fetchProductById(
  id: string,
): Promise<
  ProductRow & { fabric_name: string; defects: ProductDefectDetail[] }
> {
  const res = await fetchJson<
    SingleResponse<
      ProductRow & { fabric_name: string; defects: ProductDefectDetail[] }
    >
  >(`/api/products/${id}`);
  return res.data;
}

export async function fetchDashboardProducts(params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  grade?: string;
  fabric_type_id?: number;
  kota?: string;
  min_price?: number;
  max_price?: number;
  sort_by?: string;
  sort_order?: string;
}): Promise<{
  data: any[];
  meta: { current_page: number; per_page: number; total_products: number };
}> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.status) searchParams.set("status", params.status);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.grade) searchParams.set("grade", params.grade);
  if (params?.fabric_type_id)
    searchParams.set("fabric_type_id", String(params.fabric_type_id));
  if (params?.kota) searchParams.set("kota", params.kota);
  if (params?.min_price)
    searchParams.set("min_price", String(params.min_price));
  if (params?.max_price)
    searchParams.set("max_price", String(params.max_price));
  if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
  if (params?.sort_order) searchParams.set("sort_order", params.sort_order);

  const qs = searchParams.toString();
  const res = await fetchJson<any>(
    `/api/products/dashboard${qs ? `?${qs}` : ""}`,
  );
  return res;
}

export async function fetchDashboardProductById(id: string): Promise<any> {
  const res = await fetchJson<any>(`/api/products/dashboard/${id}`);
  return res.data;
}

export async function createProduct(
  data: CreateProductRequest,
): Promise<ProductRow> {
  const res = await fetchJson<SingleResponse<ProductRow>>("/api/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateProduct(
  id: string,
  data: UpdateProductRequest,
): Promise<ProductRow> {
  const res = await fetchJson<SingleResponse<ProductRow>>(
    `/api/products/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
  return res.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await fetch(`/api/products/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

export async function analyzeProductImages(
  imageCount: number,
): Promise<AIAnalysisResult> {
  const res = await fetchJson<AIAnalysisResult>("/api/products/ai-analyze", {
    method: "POST",
    body: JSON.stringify({ image_count: imageCount }),
  });
  return res;
}

// ─── Order API Functions ─────────────────────────────────────────

export async function fetchOrders(params?: {
  page?: number;
  limit?: number;
  status?: string;
}): Promise<PaginatedResponse<OrderListItem>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.status) searchParams.set("status", params.status);
  const qs = searchParams.toString();
  return fetchJson<PaginatedResponse<OrderListItem>>(
    `/api/orders${qs ? `?${qs}` : ""}`,
  );
}

export async function fetchOrderById(id: string): Promise<OrderWithDetails> {
  const res = await fetchJson<SingleResponse<OrderWithDetails>>(
    `/api/orders/${id}`,
  );
  return res.data;
}

export async function createOrder(data: CreateOrderRequest): Promise<OrderRow> {
  const res = await fetchJson<SingleResponse<OrderRow>>("/api/orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function cancelOrder(
  id: string,
  cancellation_reason?: string,
): Promise<OrderRow> {
  const res = await fetchJson<SingleResponse<OrderRow>>(`/api/orders/${id}`, {
    method: "PUT",
    body: JSON.stringify({ cancellation_reason: cancellation_reason || null }),
  });
  return res.data;
}

export async function payOrder(id: string): Promise<OrderRow> {
  const res = await fetchJson<SingleResponse<OrderRow>>(
    `/api/orders/${id}/pay`,
    {
      method: "POST",
    },
  );
  return res.data;
}

export async function confirmShipment(
  id: string,
  data?: ConfirmShipmentRequest,
): Promise<OrderRow> {
  const res = await fetchJson<SingleResponse<OrderRow>>(
    `/api/orders/${id}/confirm-shipment`,
    {
      method: "POST",
      body: JSON.stringify(data || {}),
    },
  );
  return res.data;
}

export async function confirmReceipt(id: string): Promise<OrderRow> {
  const res = await fetchJson<SingleResponse<OrderRow>>(
    `/api/orders/${id}/confirm-receipt`,
    {
      method: "POST",
    },
  );
  return res.data;
}

export async function submitDispute(
  id: string,
  data: CreateDisputeRequest,
): Promise<OrderDisputeRow> {
  const res = await fetchJson<SingleResponse<OrderDisputeRow>>(
    `/api/orders/${id}/dispute`,
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
  return res.data;
}

// ─── Semantic Search API ──────────────────────────────────────

export interface SemanticSearchResponse {
  results: SemanticSearchResult[];
  parsed_query: ParsedQuery;
  from_cache: boolean;
}

export async function searchSemantic(
  query: string,
  pengrajinKota?: string,
): Promise<SemanticSearchResponse> {
  const token = getToken();
  const userId = typeof window !== "undefined" ? localStorage.getItem("sb-user-id") : null;

  const res = await fetch("/api/search/semantic", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      query,
      pengrajin_id: userId ?? null,
      pengrajin_kota: pengrajinKota ?? null,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Pencarian gagal");
  }

  return res.json();
}

export async function resolveDispute(
  id: string,
  data: ResolveDisputeRequest,
): Promise<OrderRow> {
  const res = await fetchJson<SingleResponse<OrderRow>>(
    `/api/orders/${id}/dispute`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    },
  );
  return res.data;
}

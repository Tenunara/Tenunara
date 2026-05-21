import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { PRODUCTION_SOURCE_LABEL, AI_SIZE_RANGE_LABEL } from "@/lib/constants";
import type { ProductStatus, Grade } from "@/lib/types";

// ─── Helpers ───────────────────────────────────────────────────────

const COMMON_COLORS: Record<string, string> = {
  "#000000": "Black",
  "#ffffff": "White",
  "#ff0000": "Red",
  "#0000ff": "Blue",
  "#008000": "Green",
  "#ffff00": "Yellow",
  "#800080": "Purple",
  "#ffa500": "Orange",
  "#808080": "Grey",
  "#000080": "Navy Blue",
  "#ffc0cb": "Pink",
  "#a52a2a": "Brown",
  "#00ffff": "Cyan",
  "#ff00ff": "Magenta",
  "#c0c0c0": "Silver",
  "#800000": "Maroon",
  "#808000": "Olive",
  "#008080": "Teal",
  "#00008b": "Dark Blue",
  "#8b0000": "Dark Red",
  "#556b2f": "Dark Olive Green",
  "#8b008b": "Dark Magenta",
  "#9932cc": "Dark Orchid",
  "#8b4513": "Saddle Brown",
  "#2e8b57": "Sea Green",
  "#5c4033": "Dark Brown",
  "#4a3728": "Brown",
};

function hexToColorName(hex: string | null): string {
  if (!hex) return "-";
  const key = hex.toLowerCase();
  return COMMON_COLORS[key] ?? key;
}

function truncateReason(text: string | null, maxLen = 100): string {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + "....";
}

// ─── GET /api/products/dashboard ───────────────────────────────────

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const offset = (page - 1) * limit;

    const status = searchParams.get("status") as ProductStatus | null;
    const search = searchParams.get("search") || "";
    const fabricType = searchParams.get("fabric_type_id")
      ? parseInt(searchParams.get("fabric_type_id")!)
      : null;
    const grade = searchParams.get("grade") as Grade | null;
    const kota = searchParams.get("kota") || "";
    const minPrice = searchParams.get("min_price")
      ? parseFloat(searchParams.get("min_price")!)
      : null;
    const maxPrice = searchParams.get("max_price")
      ? parseFloat(searchParams.get("max_price")!)
      : null;
    const sortBy = searchParams.get("sort_by") || "created_at"; // created_at | price_per_kg
    const sortOrder = searchParams.get("sort_order") === "asc" ? "asc" as const : "desc" as const;

    let query = supabaseAdmin
      .from("products")
      .select(
        `id, umkm_id, images_url, fiber_composition, production_source, total_weight_kg,
         estimated_pieces, price_per_kg, is_negotiable, minimum_order_kg,
         ai_dominant_color, ai_pattern, ai_size_range, ai_confidence_score,
         ai_suggested_grade, ai_reasoning, final_grade, status, created_at,
         fabric_types!inner(name, category)`,
        { count: "exact" },
      );

    // Default: only published products for buyer dashboard
    query = status ? query.eq("status", status) : query.eq("status", "published");

    // Filters
    if (fabricType) query = query.eq("fabric_type_id", fabricType);
    if (grade) query = query.eq("final_grade", grade);
    if (minPrice !== null) query = query.gte("price_per_kg", minPrice);
    if (maxPrice !== null) query = query.lte("price_per_kg", maxPrice);

    // Search across notes and fiber_composition
    if (search) {
      query = query.or(`notes.ilike.%${search}%,fiber_composition.ilike.%${search}%`);
    }

    // Sorting: only allow safe column names
    const orderColumn = sortBy === "price_per_kg" ? "price_per_kg" : "created_at";
    query = query.order(orderColumn, { ascending: sortOrder === "asc" });

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      return errorResponse("Gagal memuat produk", 500, error.message);
    }

    // ── Fetch UMKM data separately and merge in-memory ──
    // (products.umkm_id → auth.users, not public.umkm, so no direct join)
    const umkmIds = [...new Set((data || []).map((p) => (p as Record<string, unknown>).umkm_id as string).filter(Boolean))];
    const umkmMap = new Map<string, Record<string, unknown>>();
    if (umkmIds.length > 0) {
      const { data: umkmData } = await supabaseAdmin
        .from("umkm")
        .select("id, nama_toko, kota, kabupaten, alamat")
        .in("id", umkmIds);
      for (const u of umkmData || []) {
        umkmMap.set(u.id, u);
      }
    }

    // Map to dashboard response shape
    const products = (data || []).map((item) => {
      const raw = item as Record<string, unknown>;
      const ft = raw.fabric_types as Record<string, unknown> | undefined;
      const u = umkmMap.get(raw.umkm_id as string);
      const images = (raw.images_url as string[]) || [];
      const aiColor = (raw.ai_dominant_color as string) || null;

      return {
        id: raw.id as string,
        images_url: images.length > 0 ? images[0] : "",
        fabric_name: (ft?.name as string) || "",
        fiber_composition: (raw.fiber_composition as string) || null,
        final_grade: (raw.final_grade as string) || (raw.ai_suggested_grade as string) || null,
        price_per_kg: Number(raw.price_per_kg) || 0,
        total_weight_kg: Number(raw.total_weight_kg) || 0,
        is_negotiable: raw.is_negotiable as boolean,
        ai_attributes: {
          dominant_color_hex: aiColor,
          dominant_color_name: hexToColorName(aiColor),
          pattern: raw.ai_pattern || null,
          size_range_label: AI_SIZE_RANGE_LABEL[(raw.ai_size_range as string) || ""] || raw.ai_size_range || null,
          confidence_score: Number(raw.ai_confidence_score) || null,
          short_reason: truncateReason(raw.ai_reasoning as string | null, 100),
        },
        umkm: {
          id: (u?.id as string) || "",
          store_name: (u?.nama_toko as string) || "",
          kota: (u?.kota as string) || "",
          kabupaten: (u?.kabupaten as string) || "",
          alamat: (u?.alamat as string) || "",
        },
      };
    });

    return jsonResponse({
      status: "success",
      message: "Products fetched successfully",
      data: products,
      meta: {
        current_page: page,
        per_page: limit,
        total_products: count || 0,
      },
    });
  } catch (err) {
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

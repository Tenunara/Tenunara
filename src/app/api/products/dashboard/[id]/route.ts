import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import {
  PRODUCTION_SOURCE_LABEL,
  HYGIENE_STATUS_LABEL,
  DEFECT_TYPE_LABEL,
} from "@/lib/constants";

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
};

function hexToColorName(hex: string | null): string {
  if (!hex) return "-";
  const key = hex.toLowerCase();
  return COMMON_COLORS[key] ?? key;
}

function parseAiReasoning(raw: string | null): {
  title: string;
  explanation: string;
} {
  if (!raw) {
    return { title: "Analisis AI Tenunara", explanation: "" };
  }
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return {
        title: parsed.title || "Analisis Integritas AI Tenunara",
        explanation: parsed.explanation || parsed.title || raw,
      };
    }
  } catch {
    // Not JSON — treat as plain text explanation
  }
  return {
    title: "Analisis Integritas AI Tenunara",
    explanation: raw,
  };
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

// ─── GET /api/products/dashboard/[id] ──────────────────────────────

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select(
        `*,
         fabric_types(name, category),
         umkm!inner(id, nama_toko, kota, kabupaten, alamat, created_at),
         product_defect_details(defect_type, defect_percentage, confidence_score)`,
      )
      .eq("id", id)
      .single();

    if (error || !product) {
      return errorResponse("Produk tidak ditemukan", 404);
    }

    const raw = product as Record<string, unknown>;
    const ft = raw.fabric_types as Record<string, unknown> | undefined;
    const u = raw.umkm as Record<string, unknown> | undefined;
    const defects = (raw.product_defect_details as Record<string, unknown>[]) || [];
    const images = (raw.images_url as string[]) || [];
    const aiColor = (raw.ai_dominant_color as string) || null;
    const prodSource = (raw.production_source as string) || "";
    const hygieneStatus = (raw.hygiene_status as string) || "";
    const weight = Number(raw.total_weight_kg) || 0;
    const price = Number(raw.price_per_kg) || 0;

    const detail = {
      id: raw.id as string,
      images_url: images,
      fabric_details: {
        name: (ft?.name as string) || "",
        category: (ft?.category as string) || null,
        fiber_composition: (raw.fiber_composition as string) || null,
        production_source: prodSource,
        production_source_label: PRODUCTION_SOURCE_LABEL[prodSource] || prodSource,
      },
      transaction_info: {
        price_per_kg: price,
        total_weight_kg: weight,
        estimated_pieces: raw.estimated_pieces ?? null,
        total_estimated_price: Math.round(price * weight * 100) / 100,
        minimum_order_kg: raw.minimum_order_kg ?? null,
        is_negotiable: raw.is_negotiable as boolean,
      },
      hygiene_and_condition: {
        hygiene_status: hygieneStatus,
        hygiene_label: HYGIENE_STATUS_LABEL[hygieneStatus] || hygieneStatus,
        has_odor: raw.has_odor as boolean,
        notes: (raw.notes as string) || null,
      },
      ai_grading_analysis: {
        system_grade: (raw.ai_suggested_grade as string) || null,
        final_grade: (raw.final_grade as string) || (raw.ai_suggested_grade as string) || null,
        is_grade_overridden: raw.is_grade_overridden as boolean,
        ai_model_version: (raw.ai_model_version as string) || null,
        global_confidence_score: Number(raw.ai_confidence_score) || null,
        processed_at: (raw.ai_processed_at as string) || null,
        ai_features: {
          dominant_color_hex: aiColor,
          dominant_color_name: hexToColorName(aiColor),
          pattern: raw.ai_pattern || null,
          size_range: (raw.ai_size_range as string) || null,
        },
        ai_reasoning: parseAiReasoning(raw.ai_reasoning as string | null),
        defect_details: defects.map((d) => {
          const dt = (d.defect_type as string) || "";
          return {
            defect_type: dt,
            defect_label: DEFECT_TYPE_LABEL[dt] || dt,
            defect_percentage: Number(d.defect_percentage) || 0,
            confidence_score: Number(d.confidence_score) || 0,
          };
        }),
      },
      umkm_seller: {
        id: (u?.id as string) || "",
        store_name: (u?.nama_toko as string) || "",
        kota: (u?.kota as string) || "",
        kabupaten: (u?.kabupaten as string) || "",
        alamat: (u?.alamat as string) || "",
        joined_at: formatDate((u?.created_at as string) || null),
      },
      status: raw.status as string,
      created_at: raw.created_at as string,
    };

    return jsonResponse({
      status: "success",
      message: "Product detail retrieved successfully",
      data: detail,
    });
  } catch (err) {
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

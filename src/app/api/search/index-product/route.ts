import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { generateEmbedding } from "@/app/api/search/generate-embedding/route";

// ─── Product Text Builder ──────────────────────────────────────────

const GRADE_DESC: Record<string, string> = {
  A: "kualitas premium sangat baik hampir sempurna",
  B: "kualitas menengah baik layak pakai",
  C: "kualitas dasar cocok untuk produk sederhana atau kerajinan",
};

const SIZE_DESC: Record<string, string> = {
  lt15cm:  "potongan sangat kecil di bawah 15 sentimeter",
  "15-30cm": "potongan kecil sedang 15 hingga 30 sentimeter",
  "30-50cm": "potongan besar 30 hingga 50 sentimeter",
  gt50cm:  "potongan sangat besar lebih dari 50 sentimeter",
};

const SOURCE_DESC: Record<string, string> = {
  sisa_pola:    "sisa pola hasil produksi konveksi",
  cacat_maklun: "kain cacat reject dari proses maklun",
  akhir_roll:   "sisa ujung roll kain dari pabrik",
};

const HYGIENE_DESC: Record<string, string> = {
  clean_washed:    "sudah dicuci bersih",
  clean_fresh_cut: "baru dipotong langsung dari produksi bersih",
  dusty:           "berdebu perlu dibersihkan sebelum digunakan",
};

function buildProductText(p: Record<string, unknown>): string {
  const fabricTypes = p.fabric_types as Record<string, unknown> | undefined;
  const umkm = p.umkm as Record<string, unknown> | undefined;

  const parts = [
    `Sisa kain ${fabricTypes?.name ?? "kain"} jenis ${fabricTypes?.category ?? "tekstil"}.`,
    fabricTypes?.common_uses ? `Kegunaan umum bahan ini antara lain: ${fabricTypes.common_uses}.` : "",
    `Warna dominan ${p.ai_dominant_color ?? "campuran"}.`,
    `Pola kain ${p.ai_pattern ?? "polos"}.`,
    `${SIZE_DESC[String(p.ai_size_range ?? "")] ?? p.ai_size_range ?? ""}.`,
    `Grade ${p.final_grade ?? p.ai_suggested_grade ?? "B"}: ${GRADE_DESC[String(p.final_grade ?? p.ai_suggested_grade ?? "B")]}.`,
    `Stok tersedia ${p.total_weight_kg} kilogram.`,
    p.minimum_order_kg ? `Minimum pembelian ${p.minimum_order_kg} kilogram.` : "Tidak ada minimum pembelian.",
    p.is_negotiable ? "Harga dapat dinegosiasi." : "Harga tetap.",
    `Sumber material: ${SOURCE_DESC[String(p.production_source ?? "")] ?? p.production_source}.`,
    `Kondisi: ${HYGIENE_DESC[String(p.hygiene_status ?? "")] ?? p.hygiene_status}.`,
    p.has_odor ? "Terdapat sedikit bau khas produksi." : "Tidak berbau.",
    `Dijual oleh ${umkm?.nama_toko ?? "penjual"} berlokasi di ${umkm?.kota ?? ""} ${umkm?.kabupaten ?? ""}.`,
    p.notes ? `Informasi tambahan dari penjual: ${p.notes}.` : "",
  ];

  return parts.filter(Boolean).join(" ");
}

// ─── API Route ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { product_id } = await request.json();

    if (!product_id) {
      return errorResponse("product_id required", 400);
    }

    // 1. Fetch product with relations
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select(`
        *,
        fabric_types(name, category, common_uses),
        umkm!inner(kota, kabupaten, nama_toko)
      `)
      .eq("id", product_id)
      .single();

    if (error || !product) {
      return errorResponse("Product not found", 404);
    }

    // 2. Build descriptive text for embedding
    const productText = buildProductText(product as Record<string, unknown>);

    // 3. Generate embedding via Voyage AI
    const embedding = await generateEmbedding(productText, "document");

    // 4. Save embedding to products table
    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({ search_embedding: embedding })
      .eq("id", product_id);

    if (updateError) {
      console.error("Save embedding error:", updateError);
      return errorResponse("Gagal menyimpan embedding", 500);
    }

    return jsonResponse({ success: true, product_id });
  } catch (err) {
    console.error("index-product error:", err);
    return errorResponse("Gagal mengindeks produk", 500);
  }
}

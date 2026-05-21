import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { parseQueryWithGemini } from "@/app/api/search/parse-query/route";
import { generateEmbedding } from "@/lib/embedding";

// ─── Configuration ─────────────────────────────────────────────────

const CACHE_TTL_MINUTES = 30;
const MATCH_CANDIDATE_COUNT = 50;
const FINAL_RESULT_COUNT = 10;

// ─── Helpers ───────────────────────────────────────────────────────

/** Ekstrak nama warna dari format "#HEXCODE;Color Name" atau "Color Name" */
function extractColorName(colorStr: string): string {
  if (!colorStr) return "";
  const afterHex = colorStr.split(";").pop() ?? colorStr;
  return afterHex.trim().toLowerCase();
}

/** Cari kecocokan warna antara query dan produk */
function matchColor(productColor: string, queryColor: string): boolean {
  if (!queryColor) return true;
  const productName = extractColorName(productColor);
  const q = queryColor.toLowerCase();

  // Exact match
  if (productName.includes(q) || q.includes(productName)) return true;

  // Color group matching
  const colorGroups: Record<string, string[]> = {
    merah: ["merah", "red", "marun", "maroon", "merah tua", "merah muda", "pink"],
    biru: ["biru", "blue", "biru tua", "biru muda", "navy", "biru laut", "toska", "turquoise"],
    hijau: ["hijau", "green", "hijau tua", "hijau muda", "olive", "army"],
    kuning: ["kuning", "yellow", "emas", "gold", "kuning muda"],
    hitam: ["hitam", "black", "gelap", "dark"],
    putih: ["putih", "white", "ivory", "cream", "krem", "putih susu"],
    coklat: ["coklat", "brown", "cokelat", "kopi", "chocolate", "coklat tua"],
    abu: ["abu", "gray", "grey", "abu-abu"],
    ungu: ["ungu", "purple", "violet", "lilac"],
    orange: ["orange", "oranye", "jingga"],
  };

  for (const [, synonyms] of Object.entries(colorGroups)) {
    const qInGroup = synonyms.some((s) => q.includes(s) || s.includes(q));
    const pInGroup = synonyms.some((s) => productName.includes(s) || s.includes(productName));
    if (qInGroup && pInGroup) return true;
  }

  return false;
}

// ─── Hard Filter Score ─────────────────────────────────────────────

function calculateHardScore(product: Record<string, unknown>, parsed: Record<string, unknown>): number {
  let score = 1.0;

  // Penalty: fabric type mismatch (soft preference)
  if (parsed.fabric_type && typeof parsed.fabric_type === "string") {
    const productFabric = String(product.fabric_type_name ?? "").toLowerCase();
    const queryFabric = String(parsed.fabric_type).toLowerCase();
    const doesMatch =
      productFabric.includes(queryFabric) || queryFabric.includes(productFabric);
    if (!doesMatch) score -= 0.35;
  }

  // Penalty: fabric category mismatch (natural/synthetic/blend)
  if (parsed.fabric_category && typeof parsed.fabric_category === "string") {
    const productCategory = String(product.fabric_category ?? "").toLowerCase();
    if (productCategory !== parsed.fabric_category.toLowerCase()) {
      score -= 0.2;
    }
  }

  // Penalty: weight less than minimum
  if (parsed.min_weight_kg && typeof parsed.min_weight_kg === "number") {
    const productWeight = Number(product.total_weight_kg) || 0;
    if (productWeight < parsed.min_weight_kg) {
      score -= 0.3;
    }
  }

  // Penalty: grade mismatch
  if (parsed.grade && typeof parsed.grade === "string") {
    const productGrade = String(product.final_grade ?? "").toUpperCase();
    if (productGrade !== parsed.grade.toUpperCase()) {
      score -= 0.25;
    }
  }

  // Penalty: color mismatch
  if (parsed.color && typeof parsed.color === "string") {
    const productColor = String(product.ai_dominant_color ?? "");
    if (!matchColor(productColor, parsed.color)) {
      score -= 0.4;
    }
  }

  return Math.max(score, 0);
}

// ─── Price Score ───────────────────────────────────────────────────

function calculatePriceScore(
  pricePerKg: number,
  allPrices: number[],
): number {
  if (allPrices.length <= 1 || pricePerKg <= 0) return 0.5;
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  if (maxPrice === minPrice) return 0.5;
  // Normalize: cheaper = higher score
  return 1 - (pricePerKg - minPrice) / (maxPrice - minPrice);
}

// ─── Re-ranking ────────────────────────────────────────────────────

function rerankResults(candidates: Record<string, unknown>[], parsed: Record<string, unknown>) {
  const allPrices = candidates.map((c) => Number(c.price_per_kg) || 0);

  return candidates
    .map((c) => {
      const semanticScore = Number(c.semantic_score) || 0;
      const hardScore = calculateHardScore(c, parsed);
      const geoBoost = Number(c.geo_boost) || 0;
      const priceScore = calculatePriceScore(Number(c.price_per_kg) || 0, allPrices);

      // Weight: semantic (core relevance) + hard filter (attribute match) + geo (location) + price (affordability)
      const finalScore = 0.45 * semanticScore + 0.25 * hardScore + 0.1 * geoBoost + 0.2 * priceScore;

      return {
        product_id:        String(c.product_id ?? ""),
        umkm_id:           String(c.umkm_id ?? ""),
        nama_toko:         String(c.nama_toko ?? ""),
        fabric_type_name:  String(c.fabric_type_name ?? ""),
        fabric_category:   String(c.fabric_category ?? ""),
        final_grade:       String(c.final_grade ?? "B") as "A" | "B" | "C",
        total_weight_kg:   Number(c.total_weight_kg) || 0,
        price_per_kg:      Number(c.price_per_kg) || 0,
        minimum_order_kg:  c.minimum_order_kg ? Number(c.minimum_order_kg) : null,
        ai_dominant_color: String(c.ai_dominant_color ?? ""),
        ai_size_range:     String(c.ai_size_range ?? ""),
        ai_pattern:        String(c.ai_pattern ?? ""),
        kota:              String(c.kota ?? ""),
        kabupaten:         String(c.kabupaten ?? ""),
        is_negotiable:     Boolean(c.is_negotiable),
        final_score:       Math.round(finalScore * 100) / 100,
        score_breakdown: {
          semantic:    Math.round(semanticScore * 100) / 100,
          hard_filter: Math.round(hardScore * 100) / 100,
          geo:         geoBoost,
          price:       Math.round(priceScore * 100) / 100,
        },
      };
    })
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, FINAL_RESULT_COUNT);
}

// ─── Main Search Handler ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { query, pengrajin_id, pengrajin_kota } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return errorResponse("Query terlalu pendek", 400);
    }

    const trimmedQuery = query.trim();

    // ── 1. Parse query with Gemini ──────────────────────────────────
    let parsed: Record<string, unknown> = { search_text: trimmedQuery };
    try {
      parsed = await parseQueryWithGemini(trimmedQuery);
    } catch (parseErr) {
      console.error("parse-query error:", parseErr);
    }

    // ── 2. Check cache ──────────────────────────────────────────────
    const cacheKey = `${trimmedQuery.toLowerCase()}-f${String(parsed.fabric_type ?? "")}-g${String(parsed.grade ?? "")}-${pengrajin_kota ?? ""}`;
    const { data: cached } = await supabaseAdmin
      .from("match_cache")
      .select("results")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return jsonResponse({ results: cached.results, from_cache: true });
    }

    // ── 3. Embed query with Voyage AI ───────────────────────────────
    const searchText = typeof parsed.search_text === "string" && parsed.search_text.trim()
      ? parsed.search_text
      : trimmedQuery;

    let embedding: number[];
    try {
      embedding = await generateEmbedding(searchText, "query");
    } catch (embedErr) {
      console.error("generate-embedding error:", embedErr);
      return errorResponse(
        "Gagal generate embedding",
        500,
        embedErr instanceof Error ? embedErr.message : "Unknown error",
      );
    }

    // ── 4. Vector search via Supabase RPC ───────────────────────────
    const { data: candidates, error: rpcError } = await supabaseAdmin.rpc(
      "match_products",
      {
        query_embedding:   embedding,
        p_fabric_type:     parsed.fabric_type ?? null,
        p_min_weight:      parsed.min_weight_kg ?? null,
        p_grade:           parsed.grade ?? null,
        p_kota_pengrajin:  pengrajin_kota ?? null,
        p_match_count:     MATCH_CANDIDATE_COUNT,
      }
    );

    if (rpcError) {
      console.error("RPC error:", rpcError);
      return errorResponse("Pencarian gagal", 500, rpcError.message);
    }

    // ── 5. Re-ranking ───────────────────────────────────────────────
    const results = rerankResults((candidates ?? []) as Record<string, unknown>[], parsed);

    // ── 6. Save to cache ────────────────────────────────────────────
    try {
      await supabaseAdmin.from("match_cache").upsert({
        cache_key: cacheKey,
        results,
        expires_at: new Date(Date.now() + CACHE_TTL_MINUTES * 60 * 1000).toISOString(),
      });
    } catch (cacheErr) {
      // Non-fatal: cache write failure should not block the response
      console.error("Cache write error:", cacheErr);
    }

    // ── 7. Log query for analytics ──────────────────────────────────
    try {
      await supabaseAdmin.from("search_queries").insert({
        pengrajin_id:  pengrajin_id ?? null,
        raw_query:     trimmedQuery,
        parsed_params: parsed,
      });
    } catch (logErr) {
      // Non-fatal: logging failure should not block the response
      console.error("Search log error:", logErr);
    }

    return jsonResponse({ results, parsed_query: parsed, from_cache: false });
  } catch (err) {
    console.error("semantic search error:", err);
    return errorResponse(
      "Pencarian gagal",
      500,
      err instanceof Error ? err.message : "Unknown error",
    );
  }
}

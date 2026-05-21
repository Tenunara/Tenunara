import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { parseQueryWithGemini } from "@/app/api/search/parse-query/route";
import { generateEmbedding } from "@/lib/embedding";

// ─── Configuration ─────────────────────────────────────────────────

const CACHE_TTL_MINUTES = 30;

// ─── Hard Filter Score ─────────────────────────────────────────────

function calculateHardScore(product: Record<string, unknown>, parsed: Record<string, unknown>): number {
  let score = 1.0;

  // Penalty: weight less than minimum
  if (parsed.min_weight_kg && typeof parsed.min_weight_kg === "number") {
    const productWeight = Number(product.total_weight_kg) || 0;
    if (productWeight < parsed.min_weight_kg) {
      score -= 0.5;
    }
  }

  // Penalty: color mismatch
  if (parsed.color && typeof parsed.color === "string" && product.ai_dominant_color) {
    const colorMatch = String(product.ai_dominant_color)
      .toLowerCase()
      .includes(parsed.color.toLowerCase());
    if (!colorMatch) score -= 0.2;
  }

  return Math.max(score, 0);
}

// ─── Re-ranking ────────────────────────────────────────────────────

function rerankResults(candidates: Record<string, unknown>[], parsed: Record<string, unknown>) {
  return candidates
    .map((c) => {
      const semanticScore = Number(c.semantic_score) || 0;
      const hardScore = calculateHardScore(c, parsed);
      const geoBoost = Number(c.geo_boost) || 0;

      const finalScore = 0.6 * semanticScore + 0.3 * hardScore + 0.1 * geoBoost;

      return {
        product_id:        String(c.product_id ?? ""),
        umkm_id:           String(c.umkm_id ?? ""),
        nama_toko:         String(c.nama_toko ?? ""),
        fabric_type_name:  String(c.fabric_type_name ?? ""),
        final_grade:       String(c.final_grade ?? "B") as "A" | "B" | "C",
        total_weight_kg:   Number(c.total_weight_kg) || 0,
        price_per_kg:      Number(c.price_per_kg) || 0,
        minimum_order_kg:  c.minimum_order_kg ? Number(c.minimum_order_kg) : null,
        ai_dominant_color: String(c.ai_dominant_color ?? ""),
        ai_size_range:     String(c.ai_size_range ?? ""),
        ai_pattern:        String(c.ai_pattern ?? ""),
        kota:              String(c.kota ?? ""),
        is_negotiable:     Boolean(c.is_negotiable),
        final_score:       Math.round(finalScore * 100) / 100,
        score_breakdown: {
          semantic:    Math.round(semanticScore * 100) / 100,
          hard_filter: Math.round(hardScore * 100) / 100,
          geo:         geoBoost,
        },
      };
    })
    .sort((a, b) => b.final_score - a.final_score)
    .slice(0, 5);
}

// ─── Main Search Handler ───────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { query, pengrajin_id, pengrajin_kota } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return errorResponse("Query terlalu pendek", 400);
    }

    const trimmedQuery = query.trim();
    const cacheKey = `${trimmedQuery.toLowerCase()}-${pengrajin_kota ?? ""}`;

    // ── 1. Check cache ──────────────────────────────────────────────
    const { data: cached } = await supabaseAdmin
      .from("match_cache")
      .select("results")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return jsonResponse({ results: cached.results, from_cache: true });
    }

    // ── 2. Parse query with Gemini ──────────────────────────────────
    let parsed: Record<string, unknown> = { search_text: trimmedQuery };
    try {
      parsed = await parseQueryWithGemini(trimmedQuery);
    } catch (parseErr) {
      console.error("parse-query error:", parseErr);
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
        p_match_count:     10,
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

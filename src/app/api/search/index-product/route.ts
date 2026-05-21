import { NextRequest } from "next/server";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { indexProductEmbedding } from "@/lib/semantic-indexing";

// ─── API Route ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { product_id } = await request.json();

    if (!product_id) {
      return errorResponse("product_id required", 400);
    }

    await indexProductEmbedding(product_id);

    return jsonResponse({ success: true, product_id });
  } catch (err) {
    if (err instanceof Error && err.message === "Product not found") {
      return errorResponse("Product not found", 404);
    }
    console.error("index-product error:", err);
    return errorResponse("Gagal mengindeks produk", 500);
  }
}

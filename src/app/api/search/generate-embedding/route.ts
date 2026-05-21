import { NextRequest } from "next/server";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { generateEmbedding } from "@/lib/embedding";

// ─── API Route ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { text, input_type = "document" } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return errorResponse("Text required", 400);
    }

    const embedding = await generateEmbedding(text.trim(), input_type);

    return jsonResponse({ embedding });
  } catch (err) {
    console.error("generate-embedding error:", err);
    return errorResponse("Gagal generate embedding", 500);
  }
}

import { NextRequest } from "next/server";
import { jsonResponse, errorResponse } from "@/lib/api-response";

// ─── Voyage AI Embedding ───────────────────────────────────────────

export async function generateEmbedding(text: string, inputType: "document" | "query" = "document") {
  const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
  if (!VOYAGE_API_KEY) {
    throw new Error("VOYAGE_API_KEY tidak dikonfigurasi");
  }

  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "voyage-3.5-lite",
      input: [text],
      input_type: inputType,
      output_dimension: 1024,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Voyage API error:", data);
    throw new Error("Embedding failed");
  }

  return data.data[0].embedding as number[];
}

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

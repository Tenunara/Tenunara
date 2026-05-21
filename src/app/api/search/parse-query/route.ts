import { NextRequest } from "next/server";
import { jsonResponse, errorResponse } from "@/lib/api-response";

// ─── Configuration ─────────────────────────────────────────────────

const FABRIC_TYPES = [
  "Katun Combed", "Katun Carded", "Denim", "Rayon", "Polyester",
  "Drill", "Spandex", "Nylon", "Kanvas", "Sutra", "Wol", "Linen",
  "Katun Oxford", "CVC (Cotton Viscose)", "TC (Tetoron Cotton)",
  "Cotton Polyester",
];

const FABRIC_ALIASES: Record<string, string> = {
  "jins": "Denim", "denim": "Denim", "jin": "Denim", "jeans": "Denim", "jean": "Denim",
  "katun": "Katun Combed", "cotton": "Katun Combed", "kaos": "Katun Combed", "kaus": "Katun Combed",
  "combed": "Katun Combed", "carded": "Katun Carded",
  "poli": "Polyester", "polyester": "Polyester", "poliester": "Polyester",
  "nilon": "Nylon", "nylon": "Nylon",
  "kanvas": "Kanvas", "canvas": "Kanvas",
  "rayon": "Rayon", "viscose": "Rayon",
  "drill": "Drill", "wol": "Wol", "wool": "Wol", "linen": "Linen", "sutra": "Sutra", "silk": "Sutra",
  "spandex": "Spandex", "stretch": "Spandex", "elastis": "Spandex",
  "oxford": "Katun Oxford", "cvc": "CVC (Cotton Viscose)",
  "tc": "TC (Tetoron Cotton)", "tetoron": "TC (Tetoron Cotton)",
};

// ─── Helper ────────────────────────────────────────────────────────

function normalizeFabricType(fabricType: string): string {
  const lower = fabricType.toLowerCase().trim();
  return FABRIC_ALIASES[lower] ?? fabricType;
}

// ─── Gemini API call ───────────────────────────────────────────────

export async function parseQueryWithGemini(query: string) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY tidak dikonfigurasi");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [{
      parts: [{
        text: `Kamu adalah parser query untuk marketplace sisa kain tekstil Indonesia bernama Tenunara.

Fabric types yang valid: ${FABRIC_TYPES.join(", ")}.

Aturan:
- "jins/jin/jeans/jean" = Denim
- "perca/sisa/bahan" = bukan filter, abaikan
- Hapus noise: "dong", "ya", "butuh", "mau", "cari", "buat", "bikin", "kak", "bang", "min", "kak", "mas", "mbak", "pak", "bu"
- min_weight_kg: angka sebelum "kg" atau "kilo"
- color: warna utama yang disebutkan (terima BAHASA INDONESIA dan Inggris).
  Warna yang dikenal: merah/red, biru/blue, hijau/green, kuning/yellow,
  hitam/black, putih/white, coklat/brown, abu-abu/grey, ungu/purple,
  orange/oranye, pink/merah muda, toska/turquoise, emas/gold, perak/silver,
  krem/cream, marun/maroon, navy/biru tua
- color: keluarkan dalam Bahasa Inggris (red, blue, green, dll)
- grade: A/B/C jika disebutkan secara eksplisit
- fabric_category: "natural" jika katun/denim/linen/sutra/wol,
  "synthetic" jika polyester/nylon/spandex/kanvas,
  "blend" jika CVC/TC/campuran. Isi hanya jika jelas dari konteks.
- search_text: teks bersih Bahasa Indonesia yang deskriptif untuk semantic search
  (hapus kata-kata filter yang sudah diekstrak, pertahankan konteks)`,
      }]
    }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          fabric_type:      { type: "string" as const, nullable: true },
          fabric_category:  { type: "string" as const, nullable: true, enum: ["natural", "synthetic", "blend"] },
          color:            { type: "string" as const, nullable: true },
          min_weight_kg:    { type: "number" as const, nullable: true },
          grade:            { type: "string" as const, nullable: true, enum: ["A", "B", "C"] },
          search_text:      { type: "string" as const }
        },
        required: ["search_text"]
      }
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  let parsed: Record<string, unknown> = { search_text: query };
  try {
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
    parsed = JSON.parse(raw);
  } catch {
    parsed = { search_text: query };
  }

  // Normalize fabric type via alias map
  if (parsed.fabric_type && typeof parsed.fabric_type === "string") {
    parsed.fabric_type = normalizeFabricType(parsed.fabric_type);
  }

  return parsed;
}

// ─── API Route ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return errorResponse("Query terlalu pendek", 400);
    }

    const parsed = await parseQueryWithGemini(query.trim());

    return jsonResponse({ parsed });
  } catch (err) {
    console.error("parse-query error:", err);
    return errorResponse("Gagal memproses query", 500);
  }
}

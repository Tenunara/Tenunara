import { jsonResponse, errorResponse } from "@/lib/api-response";
import type { AiPattern, AiSizeRange, DefectType, Grade } from "@/lib/types";

const COLORS: { name: string; hex: string }[] = [
  { name: "Navy", hex: "#000080" },
  { name: "Hitam", hex: "#000000" },
  { name: "Putih", hex: "#FFFFFF" },
  { name: "Abu-abu", hex: "#808080" },
  { name: "Biru", hex: "#0000FF" },
  { name: "Merah", hex: "#FF0000" },
  { name: "Hijau", hex: "#008000" },
  { name: "Kuning", hex: "#FFFF00" },
  { name: "Coklat", hex: "#8B4513" },
  { name: "Maroon", hex: "#800000" },
  { name: "Biru Dongker", hex: "#00008B" },
  { name: "Krem", hex: "#FFFDD0" },
];

const PATTERNS: AiPattern[] = ["polos", "motif", "batik", "stripes", "checked", "other"];
const SIZE_RANGES: AiSizeRange[] = ["lt15cm", "15-30cm", "30-50cm", "gt50cm"];
const GRADES: Grade[] = ["A", "B", "C"];
const DEFECT_TYPES: { type: DefectType; weight: number }[] = [
  { type: "noda", weight: 0.35 },
  { type: "sobek", weight: 0.15 },
  { type: "lubang", weight: 0.20 },
  { type: "warna_pudar", weight: 0.20 },
  { type: "cacat_tenun", weight: 0.10 },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function simulateAnalysis(imageCount: number) {
  const rand = seededRandom(Date.now() % 100000);

  const color = pickRandom(COLORS);
  const pattern = pickRandom(PATTERNS);
  const sizeRange = pickRandom(SIZE_RANGES);
  const confidenceScore = Math.round((0.72 + rand() * 0.25) * 100) / 100;
  const suggestedGrade = rand() > 0.6 ? "A" : rand() > 0.3 ? "B" : "C";

  // Generate 1-3 defects
  const defectCount = Math.min(imageCount, 1 + Math.floor(rand() * 3));
  const shuffledDefects = [...DEFECT_TYPES].sort(() => rand() - 0.5);
  const usedTypes = new Set<string>();

  const defects = [];
  for (const def of shuffledDefects) {
    if (defects.length >= defectCount) break;
    if (usedTypes.has(def.type)) continue;
    usedTypes.add(def.type);

    defects.push({
      defect_type: def.type,
      defect_percentage: Math.round((rand() * 8 + 0.5) * 100) / 100,
      confidence_score: Math.round((0.75 + rand() * 0.22) * 100) / 100,
    });
  }

  return {
    ai_dominant_color: `${color.hex};${color.name}`,
    ai_pattern: pattern,
    ai_size_range: sizeRange,
    ai_confidence_score: confidenceScore,
    ai_suggested_grade: suggestedGrade,
    ai_model_version: "v1.0-grading",
    defects,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image_count } = body as { image_count?: number };

    const count = image_count || 1;
    if (count < 1 || count > 5) {
      return errorResponse("Jumlah gambar harus antara 1-5", 400);
    }

    // Simulate AI processing delay
    await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));

    const result = simulateAnalysis(count);

    return jsonResponse(result);
  } catch (err) {
    return errorResponse(
      "Gagal menganalisis gambar",
      500,
      err instanceof Error ? err.message : "Unknown error",
    );
  }
}

import type { DefectType, Grade } from "@/lib/types";

export interface GradingInput {
  ai_size_range: string;
  defects: {
    defect_type: DefectType;
    defect_percentage: number;
    confidence_score: number;
  }[];
  hygiene_status: string;
  has_odor: boolean;
}

export interface GradingResult {
  final_grade: Grade;
  is_grade_overridden: boolean;
  reasons: string[];
}

type SizeCategory = "lt15cm" | "15-30cm" | "30-50cm" | "gt50cm";

function parseDimensions(dimensions: string): { maxDimensionCm: number } | null {
  const cleaned = dimensions.replace(/\s+/g, " ").trim();
  const match = cleaned.match(
    /(\d+(?:[.,]\d+)?)\s*(?:cm)?\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(?:cm)?/i,
  );
  if (!match) return null;

  const w = parseFloat(match[1].replace(",", "."));
  const l = parseFloat(match[2].replace(",", "."));
  if (isNaN(w) || isNaN(l)) return null;

  return { maxDimensionCm: Math.max(w, l) };
}

export function getSizeCategory(dimensions: string): SizeCategory {
  const parsed = parseDimensions(dimensions);
  if (!parsed) return "gt50cm"; // fallback: assume large

  const maxDim = parsed.maxDimensionCm;
  if (maxDim <= 15) return "lt15cm";
  if (maxDim <= 30) return "15-30cm";
  if (maxDim <= 50) return "30-50cm";
  return "gt50cm";
}

export function gradeProduct(input: GradingInput): GradingResult {
  const reasons: string[] = [];
  const sizeCategory = getSizeCategory(input.ai_size_range);
  const maxDefectPct = Math.max(
    ...input.defects.map((d) => d.defect_percentage),
    0,
  );

  // 1. Critical filter: dusty or has odor → auto Grade C
  if (input.hygiene_status === "dusty" || input.has_odor) {
    const reasonsList: string[] = [];
    if (input.hygiene_status === "dusty")
      reasonsList.push("Kain berdebu — downgrade otomatis ke Grade C");
    if (input.has_odor)
      reasonsList.push("Kain berbau — downgrade otomatis ke Grade C");
    return { final_grade: "C", is_grade_overridden: true, reasons: reasonsList };
  }

  // 2. Defect penalty: gt50cm with lubang (confidence > 0.85) → Grade B
  const hasCriticalHole = input.defects.some(
    (d) =>
      d.defect_type === "lubang" &&
      d.confidence_score > 0.85 &&
      sizeCategory === "gt50cm",
  );
  if (hasCriticalHole) {
    reasons.push(
      "Cacat lubang terdeteksi dengan confidence tinggi — penalti downgrade ke Grade B",
    );
    return { final_grade: "B", is_grade_overridden: true, reasons };
  }

  // 3. Size-led: lt15cm → max Grade B
  if (sizeCategory === "lt15cm") {
    reasons.push("Ukuran < 15cm — maksimal Grade B");
    if (maxDefectPct > 10) {
      reasons.push(
        `Cacat ${maxDefectPct.toFixed(1)}% melebihi 10% — turun ke Grade C`,
      );
      return { final_grade: "C", is_grade_overridden: true, reasons };
    }
    return { final_grade: "B", is_grade_overridden: true, reasons };
  }

  // 4. Grade A: size gt50cm or 30-50cm, max defect < 2%
  if (
    (sizeCategory === "gt50cm" || sizeCategory === "30-50cm") &&
    maxDefectPct < 2
  ) {
    reasons.push(
      `Ukuran ${sizeCategory === "gt50cm" ? "> 50cm" : "30-50cm"} dengan cacat ${maxDefectPct.toFixed(1)}% (< 2%) — Grade A`,
    );
    return { final_grade: "A", is_grade_overridden: false, reasons };
  }

  // 5. Grade B: size 15-30cm, or defect 2-10% with large size
  if (sizeCategory === "15-30cm" || maxDefectPct <= 10) {
    reasons.push(
      `Ukuran ${sizeCategory === "15-30cm" ? "15-30cm" : "diatas 30cm"} dengan cacat ${maxDefectPct.toFixed(1)}% (≤ 10%) — Grade B`,
    );
    return { final_grade: "B", is_grade_overridden: false, reasons };
  }

  // 6. Grade C: everything else
  reasons.push(
    `Ukuran ${sizeCategory} dengan cacat ${maxDefectPct.toFixed(1)}% (> 10%) — Grade C`,
  );
  return { final_grade: "C", is_grade_overridden: true, reasons };
}

import { jsonResponse, errorResponse } from "@/lib/api-response";
import type { AiPattern, DefectType, Grade } from "@/lib/types";
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Define the response schema to force Gemini to return your exact expected data structure
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    ai_dominant_color: {
      type: Type.STRING,
      description:
        "Format format must be: '#HEXCODE;Color Name' based on the dominant color found in the fabric.",
    },
    ai_pattern: {
      type: Type.STRING,
      enum: ["polos", "motif", "batik", "stripes", "checked", "other"],
    },
    ai_size_range: {
      type: Type.STRING,
      description:
        "Estimated fabric dimensions as 'width x length' in cm, e.g. '40cm x 60cm'. Use the A4 paper (21cm x 29.7cm) visible in the photo as a size reference to estimate actual dimensions.",
    },
    ai_confidence_score: {
      type: Type.NUMBER,
      description: "Overall analysis confidence score between 0.0 and 1.0",
    },
    ai_suggested_grade: { type: Type.STRING, enum: ["A", "B", "C"] },
    ai_reasoning: {
      type: Type.STRING,
      description:
        "Detailed explanation in Indonesian analyzing the condition, defects, and why this grade was assigned.",
    },
    defects: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          defect_type: {
            type: Type.STRING,
            enum: ["noda", "sobek", "lubang", "warna_pudar", "cacat_tenun"],
          },
          defect_percentage: {
            type: Type.NUMBER,
            description:
              "Estimated surface area percentage of this specific defect (0.0 to 100.0)",
          },
          confidence_score: {
            type: Type.NUMBER,
            description:
              "Confidence score for this specific defect detection (0.0 to 1.0)",
          },
        },
        required: ["defect_type", "defect_percentage", "confidence_score"],
      },
    },
  },
  required: [
    "ai_dominant_color",
    "ai_pattern",
    "ai_size_range",
    "ai_confidence_score",
    "ai_suggested_grade",
    "ai_reasoning",
    "defects",
  ],
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // To use real AI, your frontend must send the image data (e.g., base64 data URLs)
    const { images } = body as { images?: string[] };

    if (!images || images.length === 0) {
      return errorResponse(
        "Harus menyertakan setidaknya 1 gambar fabric untuk dianalisis.",
        400,
      );
    }
    if (images.length > 5) {
      return errorResponse("Maksimal 5 gambar yang diizinkan sekaligus.", 400);
    }

    // Convert base64 strings data URLs into the format Gemini's SDK expects
    const mediaParts = images.map((base64DataUrl) => {
      const match = base64DataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (!match)
        throw new Error(
          "Format gambar tidak valid. Harus berupa base64 data URL.",
        );
      return {
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      };
    });

    const prompt = `
      Anda adalah pakar quality control tekstil AI. Analisis gambar kain (fabric) yang disediakan.
      Identifikasi:
      1. Warna dominan terdekat (berikan HEX dan nama warnanya).
      2. Pola/Pattern kain.
      3. Estimasi dimensi kain dalam format "lebar x panjang" (contoh: "40cm x 60cm"). Jika ada kertas A4 (21cm x 29.7cm) di foto, gunakan sebagai referensi ukuran. Jika tidak ada referensi, estimasi berdasarkan konteks umum tekstil.
      4. Cari kecacatan (defects) seperti noda (stain), sobek (tear), lubang (hole), warna pudar (fading), atau cacat tenun (weaving defects).
      5. Berikan saran Grade (A/B/C) beserta alasan logisnya dalam Bahasa Indonesia.

      PENTING untuk ai_size_range: kembalikan dalam format "Lebar x Panjang" dengan satuan cm, contoh: "25cm x 35cm" atau "12cm x 18cm".
    `;

    // Call Gemini 2.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [...mediaParts, prompt],
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2, // Low temperature for consistent grading evaluations
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("AI gagal mengembalikan hasil analisis.");
    }

    // Parse the strictly validated JSON string from Gemini
    const aiResult = JSON.parse(responseText);

    // Append metadata before responding
    const finalResult = {
      ...aiResult,
      ai_model_version: "gemini-2.5-flash-v1",
      ai_processed_at: new Date().toISOString(),
    };

    return jsonResponse(finalResult);
  } catch (err) {
    return errorResponse(
      "Gagal menganalisis gambar dengan AI",
      500,
      err instanceof Error ? err.message : "Unknown error",
    );
  }
}

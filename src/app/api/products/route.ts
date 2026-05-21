import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";
import type { CreateProductRequest, ProductStatus, AIAnalysisResult } from "@/lib/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const status = searchParams.get("status") as ProductStatus | null;
    const fabricType = searchParams.get("fabric_type_id") ? parseInt(searchParams.get("fabric_type_id")!) : null;
    const search = searchParams.get("search") || "";
    const umkmId = searchParams.get("umkm_id") || null;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from("products")
      .select("*, fabric_types!inner(name, category)", { count: "exact" });

    // Filters
    if (status) {
      query = query.eq("status", status);
    }
    if (fabricType) {
      query = query.eq("fabric_type_id", fabricType);
    }
    if (umkmId) {
      query = query.eq("umkm_id", umkmId);
    }
    if (search) {
      query = query.ilike("notes", `%${search}%`);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return errorResponse("Gagal memuat produk", 500, error.message);
    }

    const products = (data || []).map((item: Record<string, unknown>) => ({
      ...item,
      fabric_name: (item.fabric_types as Record<string, unknown> | undefined)?.name,
      fabric_category: (item.fabric_types as Record<string, unknown> | undefined)?.category,
    }));

    return jsonResponse({
      data: products,
      total: count || 0,
      page,
      limit,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (user.role !== "umkm") {
      return errorResponse("Hanya UMKM yang dapat membuat produk", 403);
    }

    const body: CreateProductRequest & { ai_result?: AIAnalysisResult } = await request.json();

    // Validation
    if (!body.images_base64?.length) {
      return errorResponse("Minimal 1 foto produk diperlukan", 400);
    }
    if (body.images_base64.length > 5) {
      return errorResponse("Maksimal 5 foto produk", 400);
    }
    if (!body.fabric_type_id) {
      return errorResponse("Jenis kain wajib diisi", 400);
    }
    if (!body.production_source) {
      return errorResponse("Sumber produksi wajib diisi", 400);
    }
    if (!body.hygiene_status) {
      return errorResponse("Status kebersihan wajib diisi", 400);
    }
    if (!body.total_weight_kg || body.total_weight_kg < 0.5) {
      return errorResponse("Berat minimal 0.5 kg", 400);
    }
    if (!body.price_per_kg || body.price_per_kg <= 0) {
      return errorResponse("Harga per kg wajib diisi", 400);
    }

    // 1. Create product record
    const ai_result = body.ai_result;
    const now = ai_result?.ai_processed_at || new Date().toISOString();
    const suggestedGrade = ai_result?.ai_suggested_grade || null;
    const finalGrade = body.final_grade || suggestedGrade;

    const { data: product, error: createError } = await supabaseAdmin
      .from("products")
      .insert({
        umkm_id: user.id,
        fabric_type_id: body.fabric_type_id,
        fiber_composition: body.fiber_composition || null,
        images_url: [],
        production_source: body.production_source,
        hygiene_status: body.hygiene_status,
        has_odor: body.has_odor ?? false,
        total_weight_kg: body.total_weight_kg,
        estimated_pieces: body.estimated_pieces || null,
        price_per_kg: body.price_per_kg,
        is_negotiable: body.is_negotiable ?? false,
        minimum_order_kg: body.minimum_order_kg || null,
        notes: body.notes || null,
        ai_dominant_color: ai_result?.ai_dominant_color || null,
        ai_pattern: ai_result?.ai_pattern || null,
        ai_size_range: ai_result?.ai_size_range || null,
        ai_confidence_score: ai_result?.ai_confidence_score || null,
        ai_suggested_grade: suggestedGrade,
        ai_model_version: ai_result?.ai_model_version || null,
        ai_processed_at: now,
        final_grade: finalGrade,
        is_grade_overridden: body.final_grade !== undefined && body.final_grade !== suggestedGrade,
        status: body.status || "draft",
      })
      .select()
      .single();

    if (createError || !product) {
      return errorResponse("Gagal membuat produk", 500, createError?.message);
    }

    // 2. Upload images to Supabase Storage
    const imageUrls: string[] = [];
    for (let i = 0; i < body.images_base64.length; i++) {
      const base64Str = body.images_base64[i];
      const matches = base64Str.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) continue;

      const ext = matches[1] === "png" ? "png" : "jpg";
      const data = matches[2];
      const buffer = Buffer.from(data, "base64");
      const filePath = `products/${user.id}/${product.id}/img-${i + 1}.${ext}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("product-images")
        .upload(filePath, buffer, { contentType: `image/${ext}`, upsert: true });

      if (!uploadError) {
        const { data: urlData } = supabaseAdmin.storage
          .from("product-images")
          .getPublicUrl(filePath);
        imageUrls.push(urlData.publicUrl);
      }
    }

    // 3. Update product with image URLs
    if (imageUrls.length > 0) {
      await supabaseAdmin.from("products").update({ images_url: imageUrls }).eq("id", product.id);
    }

    // 4. Insert defect details from AI analysis
    if (ai_result?.defects?.length) {
      const defects = ai_result.defects.map((d) => ({
        product_id: product.id,
        defect_type: d.defect_type,
        defect_percentage: d.defect_percentage,
        confidence_score: d.confidence_score,
      }));

      await supabaseAdmin.from("product_defect_details").insert(defects);
    }

    return jsonResponse(
      { data: { ...product, images_url: imageUrls } },
      201,
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

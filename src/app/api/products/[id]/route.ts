import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";
import type { UpdateProductRequest } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const { data: product, error } = await supabaseAdmin
      .from("products")
      .select("*, fabric_types(name, category), product_defect_details(*)")
      .eq("id", id)
      .single();

    if (error || !product) {
      return errorResponse("Produk tidak ditemukan", 404);
    }

    // Get seller (UMKM) info
    const { data: seller } = await supabaseAdmin
      .from("umkm")
      .select("nama_penjual, nama_toko, kota")
      .eq("id", product.umkm_id)
      .single();

    return jsonResponse({
      data: {
        ...product,
        fabric_name: product.fabric_types?.name,
        fabric_category: product.fabric_types?.category,
        defects: product.product_defect_details || [],
        seller: seller || null,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await params;

    if (user.role !== "umkm") {
      return errorResponse("Hanya UMKM yang dapat mengubah produk", 403);
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("id, umkm_id, ai_suggested_grade, is_grade_overridden")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return errorResponse("Produk tidak ditemukan", 404);
    }

    if (existing.umkm_id !== user.id) {
      return errorResponse("Anda tidak memiliki akses ke produk ini", 403);
    }

    const body: UpdateProductRequest = await request.json();

    // Handle grade override tracking
    const updates: Record<string, unknown> = {};
    const allowedFields: (keyof UpdateProductRequest)[] = [
      "fabric_type_id", "fiber_composition", "production_source",
      "hygiene_status", "has_odor", "total_weight_kg", "estimated_pieces",
      "price_per_kg", "is_negotiable", "minimum_order_kg", "notes",
      "status", "final_grade", "is_grade_overridden",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Auto-detect grade override
    if (body.final_grade !== undefined && body.final_grade !== existing.ai_suggested_grade) {
      updates.is_grade_overridden = true;
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from("products")
      .update(updates)
      .eq("id", id)
      .select("*, fabric_types(name, category)")
      .single();

    if (updateError || !updated) {
      return errorResponse("Gagal mengupdate produk", 500, updateError?.message);
    }

    return jsonResponse({
      data: {
        ...updated,
        fabric_name: updated.fabric_types?.name,
        fabric_category: updated.fabric_types?.category,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(_request);
    const { id } = await params;

    if (user.role !== "umkm") {
      return errorResponse("Hanya UMKM yang dapat menghapus produk", 403);
    }

    // Verify ownership
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("products")
      .select("id, umkm_id, images_url")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return errorResponse("Produk tidak ditemukan", 404);
    }

    if (existing.umkm_id !== user.id) {
      return errorResponse("Anda tidak memiliki akses ke produk ini", 403);
    }

    // Delete images from storage
    for (const url of (existing.images_url as string[]) || []) {
      const pathMatch = url.match(/product-images\/(.+)$/);
      if (pathMatch) {
        await supabaseAdmin.storage.from("product-images").remove([pathMatch[1]]);
      }
    }

    // Delete product (cascades to defect_details)
    const { error: deleteError } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return errorResponse("Gagal menghapus produk", 500, deleteError.message);
    }

    return jsonResponse({ message: "Produk berhasil dihapus" });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";

// ─── PATCH /api/cart/items/[id] ──────────────────────────────
// Update quantity. If qty = 0, delete item.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await params;

    if (user.role !== "pengrajin") {
      return errorResponse("Hanya pengrajin yang dapat mengubah keranjang", 403);
    }

    const body: { quantity_kg: number } = await request.json();

    if (body.quantity_kg < 0) {
      return errorResponse("Jumlah tidak valid", 400);
    }

    // Verify item belongs to user's cart
    const { data: item, error: itemError } = await supabaseAdmin
      .from("cart_items")
      .select(`
        id, cart_id, product_id, quantity_kg,
        cart!inner(pengrajin_id),
        product:products(total_weight_kg, minimum_order_kg)
      `)
      .eq("id", id)
      .single();

    if (itemError || !item) {
      return errorResponse("Item tidak ditemukan", 404);
    }

    if ((item.cart as any).pengrajin_id !== user.id) {
      return errorResponse("Akses ditolak", 403);
    }

    if (body.quantity_kg === 0) {
      const { error: deleteError } = await supabaseAdmin
        .from("cart_items")
        .delete()
        .eq("id", id);

      if (deleteError) {
        return errorResponse("Gagal menghapus item", 500);
      }

      return jsonResponse({ data: { deleted: true } });
    }

    // Validate min order
    const minOrder = Number((item.product as any).minimum_order_kg || 0);
    if (body.quantity_kg < minOrder) {
      return errorResponse(`Minimal pemesanan ${minOrder} kg`, 400);
    }

    // Check stock
    const { data: reservedData } = await supabaseAdmin
      .rpc("get_available_stock", { product_uuid: item.product_id });
    const availableKg = (reservedData as number) ?? Number((item.product as any).total_weight_kg);
    if (body.quantity_kg > availableKg) {
      return errorResponse(`Stok tersedia hanya ${availableKg} kg`, 400);
    }

    const { error: updateError } = await supabaseAdmin
      .from("cart_items")
      .update({ quantity_kg: body.quantity_kg })
      .eq("id", id);

    if (updateError) {
      return errorResponse("Gagal memperbarui item", 500);
    }

    return jsonResponse({ data: { updated: true } });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// ─── DELETE /api/cart/items/[id] ─────────────────────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await params;

    if (user.role !== "pengrajin") {
      return errorResponse("Hanya pengrajin yang dapat menghapus item", 403);
    }

    // Verify item belongs to user's cart
    const { data: item } = await supabaseAdmin
      .from("cart_items")
      .select("id, cart!inner(pengrajin_id)")
      .eq("id", id)
      .single();

    if (!item) {
      return errorResponse("Item tidak ditemukan", 404);
    }

    if ((item.cart as any).pengrajin_id !== user.id) {
      return errorResponse("Akses ditolak", 403);
    }

    const { error: deleteError } = await supabaseAdmin
      .from("cart_items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return errorResponse("Gagal menghapus item", 500);
    }

    return jsonResponse({ data: { deleted: true } });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

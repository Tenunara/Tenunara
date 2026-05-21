import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";

// ─── POST /api/cart/items ────────────────────────────────────
// Add item to cart (upsert: if product already in cart, increment qty)
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (user.role !== "pengrajin") {
      return errorResponse("Hanya pengrajin yang dapat menambah keranjang", 403);
    }

    const body: { product_id: string; quantity_kg: number } = await request.json();

    if (!body.product_id || !body.quantity_kg || body.quantity_kg <= 0) {
      return errorResponse("Data tidak valid", 400);
    }

    // Validate product
    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, umkm_id, status, total_weight_kg, price_per_kg, minimum_order_kg")
      .eq("id", body.product_id)
      .single();

    if (productError || !product) {
      return errorResponse("Produk tidak ditemukan", 404);
    }

    if (product.status !== "published") {
      return errorResponse("Produk tidak tersedia", 400);
    }

    if (product.umkm_id === user.id) {
      return errorResponse("Tidak dapat menambahkan produk sendiri", 400);
    }

    if (body.quantity_kg < (product.minimum_order_kg || 0)) {
      return errorResponse(
        `Minimal pemesanan ${product.minimum_order_kg} kg untuk produk ini`,
        400,
      );
    }

    // Check stock
    const { data: reservedData } = await supabaseAdmin
      .rpc("get_available_stock", { product_uuid: product.id });
    const availableKg = (reservedData as number) ?? Number(product.total_weight_kg);
    if (body.quantity_kg > availableKg) {
      return errorResponse(`Stok tersedia hanya ${availableKg} kg`, 400);
    }

    // Get or create cart
    const { data: existingCart } = await supabaseAdmin
      .from("carts")
      .select("id")
      .eq("pengrajin_id", user.id)
      .maybeSingle();

    let cartId: string;
    if (existingCart) {
      cartId = existingCart.id;
    } else {
      const { data: newCart, error: createError } = await supabaseAdmin
        .from("carts")
        .insert({ pengrajin_id: user.id })
        .select("id")
        .single();

      if (createError || !newCart) {
        return errorResponse("Gagal membuat keranjang", 500);
      }
      cartId = newCart.id;
    }

    // Upsert: check if product already in cart
    const { data: existingItem } = await supabaseAdmin
      .from("cart_items")
      .select("id, quantity_kg")
      .eq("cart_id", cartId)
      .eq("product_id", body.product_id)
      .maybeSingle();

    if (existingItem) {
      // Update qty
      const newQty = Number(existingItem.quantity_kg) + body.quantity_kg;
      if (newQty > availableKg) {
        return errorResponse(`Stok tersedia hanya ${availableKg} kg`, 400);
      }

      const { error: updateError } = await supabaseAdmin
        .from("cart_items")
        .update({ quantity_kg: newQty })
        .eq("id", existingItem.id);

      if (updateError) {
        return errorResponse("Gagal memperbarui keranjang", 500);
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("cart_items")
        .insert({
          cart_id: cartId,
          product_id: body.product_id,
          quantity_kg: body.quantity_kg,
        });

      if (insertError) {
        return errorResponse("Gagal menambahkan ke keranjang", 500);
      }
    }

    // Return updated count
    const { count } = await supabaseAdmin
      .from("cart_items")
      .select("id", { count: "exact", head: true })
      .eq("cart_id", cartId);

    return jsonResponse({ data: { items_count: count || 0 } }, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

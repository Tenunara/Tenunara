import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";
import type { CartItem, CartGroup } from "@/lib/types";

// ─── GET /api/cart ───────────────────────────────────────────
// Get or auto-create cart with items grouped by UMKM
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (user.role !== "pengrajin") {
      return errorResponse("Hanya pengrajin yang memiliki keranjang", 403);
    }

    // Auto-create cart if not exists
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

    // Fetch cart items with product and fabric details
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("cart_items")
      .select(`
        id,
        cart_id,
        product_id,
        quantity_kg,
        created_at,
        updated_at,
        product:products!inner(
          id, umkm_id, images_url, price_per_kg,
          total_weight_kg, minimum_order_kg, status,
          fabric_type_id,
          fabric_types!inner(name)
        )
      `)
      .eq("cart_id", cartId)
      .order("created_at", { ascending: true });

    if (itemsError) {
      return errorResponse("Gagal memuat keranjang", 500, itemsError.message);
    }

    // Map items and group by UMKM
    const rawItems = (items || []) as any[];
    const enrichedItems: CartItem[] = rawItems.map((item) => ({
      id: item.id,
      cart_id: item.cart_id,
      product_id: item.product_id,
      quantity_kg: item.quantity_kg,
      product: {
        id: item.product.id,
        images_url: item.product.images_url || [],
        fabric_name: item.product.fabric_types?.name || "Kain",
        final_grade: item.product.final_grade || null,
        price_per_kg: Number(item.product.price_per_kg),
        total_weight_kg: Number(item.product.total_weight_kg),
        minimum_order_kg: item.product.minimum_order_kg ? Number(item.product.minimum_order_kg) : null,
        umkm_id: item.product.umkm_id,
        status: item.product.status,
      },
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    // Group by UMKM and fetch UMKM names
    const umkmIds = [...new Set(enrichedItems.map((i) => i.product.umkm_id))];

    const { data: umkmList } = await supabaseAdmin
      .from("umkm")
      .select("id, nama_toko")
      .in("id", umkmIds);

    const umkmNameMap = new Map(
      (umkmList || []).map((u: any) => [u.id, u.nama_toko]),
    );

    const groupMap = new Map<string, CartItem[]>();
    for (const item of enrichedItems) {
      const umkmId = item.product.umkm_id;
      if (!groupMap.has(umkmId)) groupMap.set(umkmId, []);
      groupMap.get(umkmId)!.push(item);
    }

    const groups: CartGroup[] = [];
    for (const [umkmId, items] of groupMap) {
      const subtotal = items.reduce(
        (sum, item) => sum + item.quantity_kg * Number(item.product.price_per_kg),
        0,
      );
      groups.push({
        umkm_id: umkmId,
        umkm_name: umkmNameMap.get(umkmId) || "UMKM",
        items,
        subtotal,
      });
    }

    const grandTotal = groups.reduce((sum, g) => sum + g.subtotal, 0);

    return jsonResponse({
      data: {
        id: cartId,
        items_count: enrichedItems.length,
        groups,
        grand_total: grandTotal,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// ─── POST /api/cart/checkout ─────────────────────────────────
// Convert cart items to orders (grouped by UMKM)
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (user.role !== "pengrajin") {
      return errorResponse("Hanya pengrajin yang dapat checkout", 403);
    }

    // Get cart
    const { data: cart } = await supabaseAdmin
      .from("carts")
      .select("id")
      .eq("pengrajin_id", user.id)
      .maybeSingle();

    if (!cart) {
      return errorResponse("Keranjang kosong", 400);
    }

    // Fetch cart items with product details
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("cart_items")
      .select(`
        id,
        product_id,
        quantity_kg,
        product:products(
          id, umkm_id, price_per_kg, total_weight_kg,
          minimum_order_kg, status, fabric_type_id
        )
      `)
      .eq("cart_id", cart.id);

    if (itemsError || !items || items.length === 0) {
      return errorResponse("Keranjang kosong", 400);
    }

    // Validate all items
    for (const item of items as any[]) {
      const p = item.product;
      if (!p || p.status !== "published") {
        return errorResponse("Produk tidak tersedia", 400);
      }
      if (p.umkm_id === user.id) {
        return errorResponse("Tidak dapat memesan produk sendiri", 400);
      }
      if (item.quantity_kg <= 0) {
        return errorResponse("Jumlah pemesanan tidak valid", 400);
      }
      if (p.minimum_order_kg && item.quantity_kg < p.minimum_order_kg) {
        return errorResponse(`Minimal pemesanan ${p.minimum_order_kg} kg`, 400);
      }

      // Check stock
      const { data: reservedData } = await supabaseAdmin
        .rpc("get_available_stock", { product_uuid: p.id });
      const availableKg = (reservedData as number) ?? Number(p.total_weight_kg);
      if (item.quantity_kg > availableKg) {
        return errorResponse(`Stok tersedia hanya ${availableKg} kg`, 400);
      }
    }

    // Group by UMKM
    const umkmGroups = new Map<string, any[]>();
    for (const item of items as any[]) {
      const umkmId = item.product.umkm_id;
      if (!umkmGroups.has(umkmId)) umkmGroups.set(umkmId, []);
      umkmGroups.get(umkmId)!.push(item);
    }

    // Fetch UMKM names
    const umkmIds = [...umkmGroups.keys()];
    const { data: umkmList } = await supabaseAdmin
      .from("umkm")
      .select("id, nama_toko")
      .in("id", umkmIds);
    const umkmNameMap = new Map(
      (umkmList || []).map((u: any) => [u.id, u.nama_toko]),
    );

    const createdOrders: { order_id: string; order_number: string; umkm_name: string; grand_total: number }[] = [];

    // Create one order per UMKM
    for (const [umkmId, groupItems] of umkmGroups) {
      let subtotal = 0;
      const orderItemsInput = groupItems.map((item: any) => {
        const price = Number(item.product.price_per_kg);
        const itemSubtotal = item.quantity_kg * price;
        subtotal += itemSubtotal;
        return {
          product_id: item.product_id,
          quantity_kg: item.quantity_kg,
          price_per_kg: price,
          subtotal: itemSubtotal,
        };
      });

      const shippingCost = 12000;
      const appFee = Math.round(subtotal * 0.025);
      const grandTotal = subtotal + shippingCost + appFee;

      // Create order
      const { data: order, error: orderError } = await supabaseAdmin
        .from("orders")
        .insert({
          pengrajin_id: user.id,
          umkm_id: umkmId,
          status: "pending_payment",
          subtotal,
          shipping_cost: shippingCost,
          app_fee: appFee,
          grand_total: grandTotal,
        })
        .select("id, order_number")
        .single();

      if (orderError || !order) {
        return errorResponse("Gagal membuat pesanan", 500);
      }

      // Insert order items
      const { error: itemsInsertError } = await supabaseAdmin
        .from("order_items")
        .insert(
          orderItemsInput.map((item: any) => ({
            ...item,
            order_id: order.id,
          })),
        );

      if (itemsInsertError) {
        await supabaseAdmin.from("orders").delete().eq("id", order.id);
        return errorResponse("Gagal menyimpan item pesanan", 500);
      }

      // Create stock reservations (24h expiry)
      const reservations = groupItems.map((item: any) => ({
        product_id: item.product_id,
        order_id: order.id,
        reserved_kg: item.quantity_kg,
        status: "active" as const,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }));

      await supabaseAdmin.from("stock_reservations").insert(reservations);

      createdOrders.push({
        order_id: order.id,
        order_number: order.order_number,
        umkm_name: umkmNameMap.get(umkmId) || "UMKM",
        grand_total: grandTotal,
      });
    }

    // Clear cart
    await supabaseAdmin.from("cart_items").delete().eq("cart_id", cart.id);

    return jsonResponse(
      { data: { orders: createdOrders, count: createdOrders.length } },
      201,
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

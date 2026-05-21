import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";
import type { CreateOrderRequest } from "@/lib/types";

const SHIPPING_COST_MAP: Record<string, number> = {
  reguler: 10000,
  express: 20000,
  same_day: 35000,
};

const SHIPPING_OPTION_LABEL_MAP: Record<string, string> = {
  reguler: "Reguler (3-5 hari)",
  express: "Express (1-2 hari)",
  same_day: "Same Day",
};

const PAYMENT_METHOD_LABEL_MAP: Record<string, string> = {
  transfer_bank: "Transfer Bank",
  virtual_account: "Virtual Account",
  ewallet: "E-Wallet",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── GET /api/orders ───────────────────────────────────────────────
// List orders — pengrajin sees own orders, UMKM sees incoming orders
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from("orders")
      .select(
        `
        *,
        items:order_items(
          id,
          product_id,
          quantity_kg,
          price_per_kg,
          subtotal,
          product:products(id, images_url, final_grade, fabric_type_id, fabric_types(name))
        ),
        dispute:order_disputes(id, status)
      `,
        { count: "exact" },
      );

    // Filter by role
    if (user.role === "pengrajin") {
      query = query.eq("pengrajin_id", user.id);
    } else if (user.role === "umkm") {
      query = query.eq("umkm_id", user.id);
    } else {
      return errorResponse("Role tidak dikenali", 403);
    }

    // Optional status filter
    if (status) {
      query = query.eq("status", status);
    }

    const { data: orders, count, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return errorResponse("Gagal memuat pesanan", 500, error.message);
    }

    // Map to list shape
    const items = (orders || []).map((order) => {
      const itemsArr = (order.items || []) as Array<{
        quantity_kg: number;
        product: { images_url: string[] } | null;
      }>;
      const totalWeightKg = itemsArr.reduce((sum: number, i: { quantity_kg: number }) => sum + i.quantity_kg, 0);
      const firstImage = itemsArr.find(
        (i: { product: { images_url: string[] } | null }) => i.product?.images_url?.[0],
      )?.product?.images_url?.[0] || null;

      return {
        ...order,
        items_count: itemsArr.length,
        total_weight_kg: totalWeightKg,
        first_product_image: firstImage,
        dispute_id: (order.dispute as { id: string } | null)?.id || null,
      };
    });

    return jsonResponse({
      data: items,
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

// ─── POST /api/orders ──────────────────────────────────────────────
// Create a new order (pengrajin only)
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (user.role !== "pengrajin") {
      return errorResponse("Hanya pengrajin yang dapat membuat pesanan", 403);
    }

    const body: CreateOrderRequest = await request.json();

    if (!body.items || body.items.length === 0) {
      return errorResponse("Minimal satu produk harus dipesan", 400);
    }

    if (body.items.length > 10) {
      return errorResponse("Maksimal 10 produk per pesanan", 400);
    }

    // Fetch all products in one query
    const productIds = body.items.map((i) => i.product_id);
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, umkm_id, total_weight_kg, price_per_kg, minimum_order_kg, status, fabric_type_id")
      .in("id", productIds);

    if (productsError || !products || products.length === 0) {
      return errorResponse("Produk tidak ditemukan", 404);
    }

    // Build lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate all items reference the same UMKM
    const umkmIds = new Set(products.map((p) => p.umkm_id));
    if (umkmIds.size !== 1) {
      return errorResponse("Semua produk harus dari UMKM yang sama", 400);
    }

    const umkmId = umkmIds.values().next().value as string;

    // Cannot order from yourself
    if (umkmId === user.id) {
      return errorResponse("Tidak dapat memesan produk sendiri", 400);
    }

    // Validate each item
    for (const item of body.items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return errorResponse(`Produk dengan ID ${item.product_id} tidak ditemukan`, 404);
      }
      if (product.status !== "published") {
        return errorResponse(`Produk ${item.product_id} tidak tersedia`, 400);
      }
      if (item.quantity_kg <= 0) {
        return errorResponse("Jumlah pemesanan harus lebih dari 0", 400);
      }
      if (product.minimum_order_kg && item.quantity_kg < product.minimum_order_kg) {
        return errorResponse(
          `Minimal pemesanan ${product.minimum_order_kg} kg untuk produk ini`,
          400,
        );
      }

      // Check stock availability
      const { data: reservedData } = await supabaseAdmin
        .rpc("get_available_stock", { product_uuid: item.product_id });

      const availableKg = (reservedData as number) ?? product.total_weight_kg;
      if (item.quantity_kg > availableKg) {
        return errorResponse(
          `Stok tersedia untuk produk ini hanya ${availableKg} kg`,
          400,
        );
      }
    }

    // Calculate financials
    let subtotal = 0;
    const orderItemsInput = body.items.map((item) => {
      const product = productMap.get(item.product_id)!;
      const itemSubtotal = item.quantity_kg * Number(product.price_per_kg);
      subtotal += itemSubtotal;
      return {
        product_id: item.product_id,
        quantity_kg: item.quantity_kg,
        price_per_kg: Number(product.price_per_kg),
        subtotal: itemSubtotal,
      };
    });

    const shippingCost = body.shipping_option
      ? SHIPPING_COST_MAP[body.shipping_option] ?? 15000
      : 15000; // dummy flat shipping
    const appFee = Math.round(subtotal * 0.025); // 2.5% app fee
    const grandTotal = subtotal + shippingCost + appFee;

    // Prefix notes with shipping/payment info for display on order detail
    const shippingLabel = SHIPPING_OPTION_LABEL_MAP[body.shipping_option || ""] || "";
    const paymentLabel = PAYMENT_METHOD_LABEL_MAP[body.payment_method || ""] || "";
    const metaLines: string[] = [];
    if (shippingLabel) metaLines.push(`Pengiriman: ${shippingLabel} (${formatCurrency(shippingCost)})`);
    if (paymentLabel) metaLines.push(`Pembayaran: ${paymentLabel}`);
    const metaPrefix = metaLines.length > 0 ? `===${metaLines.join(" | ")}===\n` : "";
    const orderNotes = body.notes ? `${metaPrefix}${body.notes}` : metaPrefix || null;

    // Create order, items, and stock reservations
    const { data: order, error: createError } = await supabaseAdmin
      .from("orders")
      .insert({
        pengrajin_id: user.id,
        umkm_id: umkmId,
        status: "pending_payment",
        subtotal,
        shipping_cost: shippingCost,
        app_fee: appFee,
        grand_total: grandTotal,
        notes: orderNotes,
      })
      .select()
      .single();

    if (createError || !order) {
      return errorResponse("Gagal membuat pesanan", 500, createError?.message);
    }

    // Insert order items
    const itemsWithOrderId = orderItemsInput.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from("order_items")
      .insert(itemsWithOrderId);

    if (itemsError) {
      // Cleanup: delete the order if items fail
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return errorResponse("Gagal menyimpan item pesanan", 500, itemsError.message);
    }

    // Create stock reservations (expire in 24h)
    const reservations = body.items.map((item) => ({
      product_id: item.product_id,
      order_id: order.id,
      reserved_kg: item.quantity_kg,
      status: "active" as const,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }));

    const { error: reservationError } = await supabaseAdmin
      .from("stock_reservations")
      .insert(reservations);

    if (reservationError) {
      // Non-fatal: order created, reservations failed
      console.error("Failed to create stock reservations:", reservationError);
    }

    return jsonResponse({ data: order }, 201);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

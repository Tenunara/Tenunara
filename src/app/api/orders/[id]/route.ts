import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";

// ─── GET /api/orders/[id] ──────────────────────────────────────────
// Full order detail with items, history, escrow, dispute, parties
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(_request);
    const { id } = await params;

    const { data: order, error } = await supabaseAdmin
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
          created_at,
          product:products(
            id, images_url, final_grade, fabric_type_id,
            fabric_types(name, category)
          )
        ),
        status_history:order_status_history(
          id, from_status, to_status, changed_by, notes, created_at
        ),
        escrow:escrow_transactions(
          id, amount, status, held_at, released_at, refunded_at
        ),
        dispute:order_disputes(
          id, raised_by, dispute_reason, description, image_urls,
          status, resolution, resolution_type, resolved_by, resolved_at,
          created_at, updated_at
        ),
        waste_log:waste_diversion_logs(
          id, total_weight_kg, logged_at
        ),
        pengrajin(
          nama, email, nomor_telepon, kota, kabupaten, alamat, foto_profil_url
        ),
        umkm(
          nama_penjual, nama_toko, email, nomor_telepon, kota, kabupaten, alamat, foto_profil_url
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !order) {
      return errorResponse("Pesanan tidak ditemukan", 404);
    }

    // Verify access
    if (user.role === "pengrajin" && order.pengrajin_id !== user.id) {
      return errorResponse("Anda tidak memiliki akses ke pesanan ini", 403);
    }
    if (user.role === "umkm" && order.umkm_id !== user.id) {
      return errorResponse("Anda tidak memiliki akses ke pesanan ini", 403);
    }

    // Flatten joined profiles
    const result = {
      ...order,
      items: (order.items || []).map((item: Record<string, unknown>) => ({
        ...item,
        product: item.product
          ? {
              ...(item.product as object),
              fabric_name: (item.product as any)?.fabric_types?.name || null,
              fabric_category: (item.product as any)?.fabric_types?.category || null,
            }
          : null,
      })),
      pengrajin: order.pengrajin?.[0] || null,
      umkm: order.umkm?.[0] || null,
    };

    return jsonResponse({ data: result });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// ─── PUT /api/orders/[id] ──────────────────────────────────────────
// Cancel an order — pengrajin (before payment) or UMKM (before shipment)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await params;

    const { cancellation_reason } = await request.json();

    // Fetch order
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, pengrajin_id, umkm_id, status")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return errorResponse("Pesanan tidak ditemukan", 404);
    }

    // Only cancel if in pending_payment or awaiting_shipment
    if (!["pending_payment", "awaiting_shipment"].includes(order.status)) {
      return errorResponse("Pesanan sudah tidak dapat dibatalkan", 400);
    }

    if (user.role === "pengrajin" && order.pengrajin_id === user.id) {
      // Pengrajin can only cancel before payment
      if (order.status !== "pending_payment") {
        return errorResponse(
          "Pesanan sudah dibayar. Hubungi UMKM untuk pembatalan.",
          400,
        );
      }
    } else if (user.role === "umkm" && order.umkm_id === user.id) {
      // UMKM can cancel before shipment
      // OK regardless of payment status
    } else {
      return errorResponse("Anda tidak memiliki akses ke pesanan ini", 403);
    }

    // Update status to cancelled
    // Trigger will handle: release escrow (if paid), release stock reservations
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: cancellation_reason || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updated) {
      return errorResponse("Gagal membatalkan pesanan", 500, updateError?.message);
    }

    return jsonResponse({ data: updated, message: "Pesanan berhasil dibatalkan" });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

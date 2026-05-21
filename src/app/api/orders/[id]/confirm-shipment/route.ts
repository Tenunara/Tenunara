import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";
import type { ConfirmShipmentRequest } from "@/lib/types";

// ─── POST /api/orders/[id]/confirm-shipment ────────────────────────
// UMKM confirms handover to courier — order must be awaiting_shipment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await params;

    if (user.role !== "umkm") {
      return errorResponse("Hanya UMKM yang dapat mengkonfirmasi pengiriman", 403);
    }

    // Fetch order
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, umkm_id, status")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return errorResponse("Pesanan tidak ditemukan", 404);
    }

    if (order.umkm_id !== user.id) {
      return errorResponse("Anda tidak memiliki akses ke pesanan ini", 403);
    }

    if (order.status !== "awaiting_shipment") {
      return errorResponse("Pesanan tidak dalam status menunggu pengiriman", 400);
    }

    const body: ConfirmShipmentRequest = await request.json().catch(() => ({}));

    // Update status to in_verification
    // Trigger will auto-set escrow_release_at = now() + 3 days
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "in_verification",
        confirmed_by_seller_at: new Date().toISOString(),
        courier_name: body.courier_name || null,
        tracking_number: body.tracking_number || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updated) {
      return errorResponse("Gagal mengkonfirmasi pengiriman", 500, updateError?.message);
    }

    return jsonResponse({
      data: updated,
      message:
        "Pengiriman dikonfirmasi. Masa validasi 3 hari dimulai sekarang. Pembeli akan memeriksa barang.",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

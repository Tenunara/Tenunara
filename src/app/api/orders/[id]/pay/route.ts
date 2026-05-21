import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";

// ─── POST /api/orders/[id]/pay ─────────────────────────────────────
// Simulate payment — pengrajin only, order must be pending_payment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await params;

    if (user.role !== "pengrajin") {
      return errorResponse("Hanya pengrajin yang dapat melakukan pembayaran", 403);
    }

    // Fetch order
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, pengrajin_id, status, grand_total")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return errorResponse("Pesanan tidak ditemukan", 404);
    }

    if (order.pengrajin_id !== user.id) {
      return errorResponse("Anda tidak memiliki akses ke pesanan ini", 403);
    }

    if (order.status !== "pending_payment") {
      return errorResponse("Pesanan tidak dalam status menunggu pembayaran", 400);
    }

    // Simulate payment: update status to awaiting_shipment
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "awaiting_shipment",
        payment_simulated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updated) {
      return errorResponse("Gagal memproses pembayaran", 500, updateError?.message);
    }

    return jsonResponse({
      data: updated,
      message: "Pembayaran berhasil (simulasi). Dana ditahan di Escrow Tenunara.",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

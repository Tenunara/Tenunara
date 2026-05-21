import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";

// ─── POST /api/orders/[id]/confirm-receipt ─────────────────────────
// Pengrajin confirms goods received — order must be in_verification
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await params;

    if (user.role !== "pengrajin") {
      return errorResponse("Hanya pengrajin yang dapat mengkonfirmasi penerimaan barang", 403);
    }

    // Fetch order
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, pengrajin_id, status")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      return errorResponse("Pesanan tidak ditemukan", 404);
    }

    if (order.pengrajin_id !== user.id) {
      return errorResponse("Anda tidak memiliki akses ke pesanan ini", 403);
    }

    if (order.status !== "in_verification") {
      return errorResponse("Pesanan tidak dalam masa validasi", 400);
    }

    // Update status to completed
    // Triggers will:
    // 1. Set confirmed_by_buyer_at = now()
    // 2. Set completed_at = now()
    // 3. Release escrow to UMKM
    // 4. Log waste diversion
    // 5. Consume stock reservations
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "completed",
        confirmed_by_buyer_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updated) {
      return errorResponse("Gagal mengkonfirmasi penerimaan", 500, updateError?.message);
    }

    return jsonResponse({
      data: updated,
      message:
        "Barang diterima dan sesuai. Pesanan selesai. Dana escrow telah diteruskan ke UMKM.",
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

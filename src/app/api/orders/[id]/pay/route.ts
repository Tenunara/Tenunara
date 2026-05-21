import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";

const SHIPPING_COST_MAP: Record<string, number> = {
  jne: 12000,
  jnt: 11000,
  sicepat: 13000,
  anteraja: 10000,
  ninja_xpress: 12500,
};

const SHIPPING_OPTION_LABEL_MAP: Record<string, string> = {
  jne: "JNE",
  jnt: "J&T Express",
  sicepat: "SiCepat Ekspres",
  anteraja: "Anteraja",
  ninja_xpress: "Ninja Xpress",
};

const PAYMENT_METHOD_LABEL_MAP: Record<string, string> = {
  ewallet: "Dompet Digital (E-Wallet)",
  qris: "QRIS",
  virtual_account: "Virtual Account",
  transfer_bank: "Transfer Bank Langsung",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

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
      .select("id, pengrajin_id, status, subtotal, shipping_cost, app_fee, grand_total, notes")
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

    const body = await request.json().catch(() => ({}));
    const shippingOption = body.shipping_option as string | undefined;
    const paymentMethod = body.payment_method as string | undefined;

    // Recalculate shipping cost and grand total
    const newShippingCost = shippingOption
      ? (SHIPPING_COST_MAP[shippingOption] ?? order.shipping_cost)
      : order.shipping_cost;
    const newGrandTotal = Number(order.subtotal) + newShippingCost + Number(order.app_fee);

    // Build notes metadata with shipping/payment info
    let newNotes = order.notes || "";
    const shippingLabel = shippingOption ? SHIPPING_OPTION_LABEL_MAP[shippingOption] || "" : "";
    const paymentLabel = paymentMethod ? PAYMENT_METHOD_LABEL_MAP[paymentMethod] || "" : "";
    const metaLines: string[] = [];
    if (shippingLabel) metaLines.push(`Pengiriman: ${shippingLabel} (${formatCurrency(newShippingCost)})`);
    if (paymentLabel) metaLines.push(`Pembayaran: ${paymentLabel}`);
    const metaPrefix = metaLines.length > 0 ? `===${metaLines.join(" | ")}===\n` : "";

    // Remove any existing meta prefix, then prepend new one
    const cleanNotes = newNotes.replace(/^===.*?===\n?/, "");
    newNotes = metaPrefix + cleanNotes;

    // Simulate payment: update status and recalculate totals
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "awaiting_shipment",
        payment_simulated_at: new Date().toISOString(),
        shipping_cost: newShippingCost,
        grand_total: newGrandTotal,
        notes: newNotes || null,
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

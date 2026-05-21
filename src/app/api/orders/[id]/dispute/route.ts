import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";
import type { CreateDisputeRequest, ResolveDisputeRequest } from "@/lib/types";

// ─── POST /api/orders/[id]/dispute ─────────────────────────────────
// File a complaint — pengrajin only, order must be in_verification
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await params;

    if (user.role !== "pengrajin") {
      return errorResponse("Hanya pengrajin yang dapat mengajukan komplain", 403);
    }

    const body: CreateDisputeRequest = await request.json();

    if (!body.dispute_reason || !body.description) {
      return errorResponse("Alasan dan deskripsi komplain wajib diisi", 400);
    }

    if (body.description.length < 10) {
      return errorResponse("Deskripsi komplain minimal 10 karakter", 400);
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
      return errorResponse("Komplain hanya dapat diajukan selama masa validasi", 400);
    }

    // Check no existing dispute
    const { data: existingDispute } = await supabaseAdmin
      .from("order_disputes")
      .select("id")
      .eq("order_id", id)
      .maybeSingle();

    if (existingDispute) {
      return errorResponse("Komplain sudah pernah diajukan untuk pesanan ini", 400);
    }

    // Upload dispute images if provided
    let imageUrls: string[] = [];
    if (body.images_base64 && body.images_base64.length > 0) {
      const uploadPromises = body.images_base64.slice(0, 3).map(async (base64, idx) => {
        const buffer = Buffer.from(base64, "base64");
        const path = `disputes/${id}/${Date.now()}-${idx}.jpg`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("product-images")
          .upload(path, buffer, { contentType: "image/jpeg", upsert: false });

        if (uploadError) return null;

        const { data: urlData } = supabaseAdmin.storage
          .from("product-images")
          .getPublicUrl(path);

        return urlData.publicUrl;
      });

      const results = await Promise.all(uploadPromises);
      imageUrls = results.filter((url): url is string => url !== null);
    }

    // Create dispute record
    const { data: dispute, error: disputeError } = await supabaseAdmin
      .from("order_disputes")
      .insert({
        order_id: id,
        raised_by: user.id,
        dispute_reason: body.dispute_reason,
        description: body.description,
        image_urls: imageUrls,
        status: "open",
      })
      .select()
      .single();

    if (disputeError || !dispute) {
      return errorResponse("Gagal mengajukan komplain", 500, disputeError?.message);
    }

    // Update order status to dispute
    const { error: orderError } = await supabaseAdmin
      .from("orders")
      .update({ status: "dispute" })
      .eq("id", id);

    if (orderError) {
      console.error("Failed to update order status to dispute:", orderError);
    }

    return jsonResponse(
      {
        data: dispute,
        message: "Komplain berhasil diajukan. Dana escrow ditahan hingga penyelesaian.",
      },
      201,
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

// ─── PUT /api/orders/[id]/dispute ──────────────────────────────────
// Resolve dispute — UMKM only
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await params;

    if (user.role !== "umkm") {
      return errorResponse("Hanya UMKM yang dapat menyelesaikan komplain", 403);
    }

    const body: ResolveDisputeRequest = await request.json();

    if (!body.resolution || !body.resolution_type || !body.action) {
      return errorResponse("Resolusi, tipe, dan aksi wajib diisi", 400);
    }

    if (!["complete", "cancel"].includes(body.action)) {
      return errorResponse("Aksi harus 'complete' atau 'cancel'", 400);
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

    if (order.status !== "dispute") {
      return errorResponse("Pesanan tidak dalam status sengketa", 400);
    }

    // Fetch dispute
    const { data: dispute, error: disputeFetchError } = await supabaseAdmin
      .from("order_disputes")
      .select("id, status")
      .eq("order_id", id)
      .single();

    if (disputeFetchError || !dispute) {
      return errorResponse("Komplain tidak ditemukan", 404);
    }

    if (dispute.status !== "open") {
      return errorResponse("Komplain sudah ditangani", 400);
    }

    // Update dispute
    const { error: disputeUpdateError } = await supabaseAdmin
      .from("order_disputes")
      .update({
        status: "resolved",
        resolution: body.resolution,
        resolution_type: body.resolution_type,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", dispute.id);

    if (disputeUpdateError) {
      return errorResponse("Gagal menyelesaikan komplain", 500, disputeUpdateError.message);
    }

    // Update order status based on action
    const newStatus = body.action === "complete" ? "completed" : "cancelled";
    const orderUpdates: Record<string, unknown> = {
      status: newStatus,
    };

    if (body.action === "complete") {
      orderUpdates.confirmed_by_buyer_at = new Date().toISOString();
      orderUpdates.completed_at = new Date().toISOString();
    } else {
      orderUpdates.cancelled_at = new Date().toISOString();
      orderUpdates.cancellation_reason = `Komplain diselesaikan: ${body.resolution_type}`;
    }

    const { data: updatedOrder, error: orderUpdateError } = await supabaseAdmin
      .from("orders")
      .update(orderUpdates)
      .eq("id", id)
      .select()
      .single();

    if (orderUpdateError) {
      return errorResponse("Gagal mengupdate status pesanan", 500, orderUpdateError.message);
    }

    const message =
      body.action === "complete"
        ? "Komplain diselesaikan. Dana escrow diteruskan ke UMKM."
        : "Komplain diselesaikan. Pesanan dibatalkan, dana dikembalikan ke pembeli.";

    return jsonResponse({ data: updatedOrder, message });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    return errorResponse("Terjadi kesalahan server", 500);
  }
}

import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";
import type {
  UmkmDashboardResponse,
  DashboardTrend,
  DashboardTransaction,
} from "@/lib/types";

export const dynamic = "force-dynamic";

// ─── GET /api/dashboard/umkm ──────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (user.role !== "umkm") {
      return errorResponse("Hanya akun UMKM yang dapat mengakses dashboard ini", 403);
    }

    const umkmId = user.id;

    // ════════════════════════════════════════════════════════════
    // 1. PROFILE
    // ════════════════════════════════════════════════════════════
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("umkm")
      .select("*")
      .eq("id", umkmId)
      .single();

    if (profileErr || !profile) {
      return errorResponse("Profil UMKM tidak ditemukan", 404);
    }

    // ════════════════════════════════════════════════════════════
    // 2. ORDERS — completed / in-progress
    // ════════════════════════════════════════════════════════════
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, status, pengrajin_id, created_at, completed_at")
      .eq("umkm_id", umkmId)
      .in("status", ["completed", "in_verification", "awaiting_shipment", "dispute"]);

    const activeOrders = orders || [];
    const completedOrders = activeOrders.filter((o) => o.status === "completed");
    const activeOrderIds = activeOrders.map((o) => o.id);
    const completedOrderIds = completedOrders.map((o) => o.id);

    // ════════════════════════════════════════════════════════════
    // 3. ORDER ITEMS
    // ════════════════════════════════════════════════════════════
    let allItems: { order_id: string; product_id: string; quantity_kg: number; subtotal: number }[] = [];
    let completedItems: {
      order_id: string;
      product_id: string;
      quantity_kg: number;
      subtotal: number;
      price_per_kg: number;
    }[] = [];

    if (activeOrderIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("order_items")
        .select("order_id, product_id, quantity_kg, subtotal")
        .in("order_id", activeOrderIds);
      allItems = (data || []) as typeof allItems;
    }

    if (completedOrderIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("order_items")
        .select("order_id, product_id, quantity_kg, subtotal, price_per_kg")
        .in("order_id", completedOrderIds);
      completedItems = (data || []) as typeof completedItems;
    }

    // ════════════════════════════════════════════════════════════
    // 4. PRODUCT GRADES
    // ════════════════════════════════════════════════════════════
    const productIds = [...new Set(allItems.map((i) => i.product_id))];
    const productGradeMap = new Map<string, string | null>();

    if (productIds.length > 0) {
      const { data: products } = await supabaseAdmin
        .from("products")
        .select("id, final_grade, ai_suggested_grade")
        .in("id", productIds);

      for (const p of products || []) {
        productGradeMap.set(p.id, p.final_grade || p.ai_suggested_grade);
      }
    }

    // ════════════════════════════════════════════════════════════
    // 5. WASTE DIVERSION LOGS
    // ════════════════════════════════════════════════════════════
    const { data: wasteLogs } = await supabaseAdmin
      .from("waste_diversion_logs")
      .select("order_id, total_weight_kg, logged_at")
      .eq("umkm_id", umkmId);

    const wasteLogMap = new Map(
      (wasteLogs || []).map((w) => [w.order_id, w]),
    );

    // ════════════════════════════════════════════════════════════
    // 6. TRANSACTION VIEW
    // ════════════════════════════════════════════════════════════
    const viewResult = await supabaseAdmin
      .from("umkm_waste_transaction_view")
      .select("*")
      .eq("umkm_id", umkmId)
      .order("timestamp", { ascending: false })
      .limit(50);

    const rawTransactions = viewResult.data || [];

    // ════════════════════════════════════════════════════════════
    // COMPUTE: METRICS (II)
    // ════════════════════════════════════════════════════════════
    const totalWasteGenerated = allItems.reduce(
      (s, i) => s + Number(i.quantity_kg),
      0,
    );

    const totalWasteDiverted = (wasteLogs || []).reduce(
      (s, w) => s + Number(w.total_weight_kg),
      0,
    );

    const landfillDiversionRate =
      totalWasteGenerated > 0
        ? Math.round((totalWasteDiverted / totalWasteGenerated) * 100 * 100) / 100
        : 0;

    const wasteToDisposal = Math.max(
      0,
      Math.round((totalWasteGenerated - totalWasteDiverted) * 100) / 100,
    );

    // ════════════════════════════════════════════════════════════
    // COMPUTE: DISTRIBUTION (III)
    // ════════════════════════════════════════════════════════════
    let upcycleVolume = 0;
    let recycleVolume = 0;

    for (const item of completedItems) {
      const grade = productGradeMap.get(item.product_id);
      const kg = Number(item.quantity_kg);
      if (grade === "A" || grade === "B") upcycleVolume += kg;
      else if (grade === "C") recycleVolume += kg;
      // Grade D items (if any) fall through unallocated; they count in
      // totalWasteGenerated but do not contribute to upcycle or recycle.
    }

    const activePartnerCount = new Set(
      completedOrders.map((o) => o.pengrajin_id).filter(Boolean),
    ).size;

    // ════════════════════════════════════════════════════════════
    // COMPUTE: IMPACT (IV)
    // ════════════════════════════════════════════════════════════
    const co2eAvoidedKg = Math.round(totalWasteDiverted * 0.6 * 100) / 100;

    const localEconomicMultiplier = completedItems.reduce(
      (s, i) => s + Number(i.subtotal),
      0,
    );

    // ════════════════════════════════════════════════════════════
    // COMPUTE: MONTHLY TREND
    // ════════════════════════════════════════════════════════════
    const generatedByMonth = new Map<string, number>();
    const divertedByMonth = new Map<string, number>();

    for (const order of activeOrders) {
      const monthKey = order.created_at?.slice(0, 7);
      if (!monthKey) continue;
      const orderItems = allItems.filter((i) => i.order_id === order.id);
      const monthTotal = orderItems.reduce((s, i) => s + Number(i.quantity_kg), 0);
      generatedByMonth.set(monthKey, (generatedByMonth.get(monthKey) || 0) + monthTotal);
    }

    for (const order of completedOrders) {
      const log = wasteLogMap.get(order.id);
      if (!log) continue;
      const monthKey = (log.logged_at || order.completed_at || "")?.slice(0, 7);
      if (!monthKey) continue;
      divertedByMonth.set(
        monthKey,
        (divertedByMonth.get(monthKey) || 0) + Number(log.total_weight_kg),
      );
    }

    const allMonths = new Set([...generatedByMonth.keys(), ...divertedByMonth.keys()]);
    const trend: DashboardTrend[] = [...allMonths].sort().map((month) => ({
      month,
      waste_generated_kg: generatedByMonth.get(month) || 0,
      waste_diverted_kg: divertedByMonth.get(month) || 0,
    }));

    // ════════════════════════════════════════════════════════════
    // COMPUTE: TRANSACTIONS
    // ════════════════════════════════════════════════════════════
    const transactions: DashboardTransaction[] = rawTransactions.map((t: Record<string, unknown>) => ({
      transaction_id: t.transaction_id as string,
      timestamp: t.timestamp as string,
      material_type: t.material_type as string,
      grade: (t.grade as string) || "-",
      weight_kg: Number(t.weight_kg),
      price_per_kg: Number(t.price_per_kg || 0),
      subtotal: Number(t.subtotal || 0),
      receiver_name: (t.receiver_name as string) || "Belum ditugaskan",
      receiver_id: (t.receiver_id as string) || "",
      verification_status: t.verification_status as DashboardTransaction["verification_status"],
      hash_code: t.hash_code as string,
      order_id: t.order_id as string,
      order_number: t.order_number as string,
    }));

    // ════════════════════════════════════════════════════════════
    // GOVERNANCE
    // ════════════════════════════════════════════════════════════
    const governance = {
      auditor_log:
        "Data diverifikasi oleh sistem otomasi token automatching platform Tenunara. " +
        "Setiap transaksi diamankan dengan hash kriptografi SHA-256 yang menjamin " +
        "integritas data dan mencegah manipulasi. Laporan ini sesuai standar " +
        "GRI 306 dan POJK 51.",
    };

    // ════════════════════════════════════════════════════════════
    // BUILD RESPONSE
    // ════════════════════════════════════════════════════════════
    const response: UmkmDashboardResponse = {
      profile: {
        id: profile.id,
        nama_penjual: profile.nama_penjual,
        nama_toko: profile.nama_toko,
        email: profile.email,
        nomor_telepon: profile.nomor_telepon,
        foto_profil_url: profile.foto_profil_url,
        npwp_nib: profile.npwp_nib || null,
        skala_usaha: profile.skala_usaha || null,
        kota: profile.kota,
        kabupaten: profile.kabupaten,
        alamat: profile.alamat,
      },
      metrics: {
        total_waste_generated_kg: Math.round(totalWasteGenerated * 100) / 100,
        total_waste_diverted_kg: Math.round(totalWasteDiverted * 100) / 100,
        landfill_diversion_rate: landfillDiversionRate,
        waste_to_disposal_kg: wasteToDisposal,
      },
      distribution: {
        upcycle_volume_kg: Math.round(upcycleVolume * 100) / 100,
        recycle_volume_kg: Math.round(recycleVolume * 100) / 100,
        active_partner_count: activePartnerCount,
      },
      impact: {
        co2e_avoided_kg: co2eAvoidedKg,
        local_economic_multiplier: Math.round(localEconomicMultiplier * 100) / 100,
      },
      trend,
      transactions,
      governance,
    };

    return jsonResponse(response);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return errorResponse(message, 500);
  }
}

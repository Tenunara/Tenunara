import { errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";
import { getUmkmDashboardData } from "@/lib/dashboard";
import { generateSustainabilityReport } from "@/lib/report-generator";

export const dynamic = "force-dynamic";

// ─── GET /api/dashboard/umkm/report ───────────────────────────────────

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (user.role !== "umkm") {
      return errorResponse("Hanya akun UMKM yang dapat mengakses laporan ini", 403);
    }

    const data = await getUmkmDashboardData(user.id);

    const today = new Date();
    const tanggalCetak = today.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });

    const html = generateSustainabilityReport(data, tanggalCetak);

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return errorResponse(message, 500);
  }
}

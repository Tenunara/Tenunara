import { jsonResponse, errorResponse } from "@/lib/api-response";
import { getAuthenticatedUser, AuthError } from "@/lib/api-auth";
import { getUmkmDashboardData } from "@/lib/dashboard";

export const dynamic = "force-dynamic";

// ─── GET /api/dashboard/umkm ──────────────────────────────────────────

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    if (user.role !== "umkm") {
      return errorResponse("Hanya akun UMKM yang dapat mengakses dashboard ini", 403);
    }

    const response = await getUmkmDashboardData(user.id);
    return jsonResponse(response);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.statusCode);
    }
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return errorResponse(message, 500);
  }
}

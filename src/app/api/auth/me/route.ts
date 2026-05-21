import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";

export async function GET(request: Request) {
  // 1. Extract Bearer token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("Token tidak ditemukan", 401);
  }

  const token = authHeader.replace("Bearer ", "");

  // 2. Verify token
  const { data: userData, error: verifyError } = await supabaseAdmin.auth.getUser(token);

  if (verifyError || !userData.user) {
    return errorResponse("Token tidak valid atau sudah kadaluarsa", 401);
  }

  const userId = userData.user.id;
  const role = userData.user.user_metadata?.role as string;

  if (!role) {
    return errorResponse("Akun tidak memiliki role", 403);
  }

  // 3. Fetch profile
  const table = role === "pengrajin" ? "pengrajin" : "umkm";
  const { data: profile, error: profileError } = await supabaseAdmin
    .from(table)
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return errorResponse("Profil tidak ditemukan", 404);
  }

  return jsonResponse({
    user: {
      id: userId,
      email: userData.user.email!,
      role,
    },
    profile,
  });
}

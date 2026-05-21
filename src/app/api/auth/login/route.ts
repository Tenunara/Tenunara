import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return errorResponse("Email dan password wajib diisi", 400);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !signInData.session) {
    return errorResponse("Email atau password salah", 401);
  }

  const userId = signInData.user.id;
  const role = signInData.user.user_metadata?.role as string;

  if (!role) {
    return errorResponse("Akun tidak memiliki role yang valid", 403);
  }

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
      email: signInData.user.email!,
      role,
    },
    session: {
      access_token: signInData.session.access_token,
      refresh_token: signInData.session.refresh_token,
      expires_at: signInData.session.expires_at ?? 0,
    },
    profile,
  });
}

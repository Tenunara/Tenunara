import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import type { RegisterPengrajinRequest } from "@/lib/types";

export async function POST(request: Request) {
  const body: RegisterPengrajinRequest = await request.json();
  const { nama, email, nomor_telepon, password, kota, kabupaten, alamat, foto_profil_base64 } = body;

  if (!nama || !email || !nomor_telepon || !password || !kota || !kabupaten || !alamat) {
    return errorResponse("Semua field wajib harus diisi", 400);
  }

  if (password.length < 8) {
    return errorResponse("Password minimal 8 karakter", 400);
  }

  // 1. Create auth user via admin API
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "pengrajin", nama },
  });

  if (authError) {
    if (authError.message.includes("already registered")) {
      return errorResponse("Email sudah terdaftar", 409);
    }
    return errorResponse("Gagal membuat akun", 500, authError.message);
  }

  const userId = authData.user.id;
  let foto_profil_url: string | null = null;

  // 2. Upload foto profil if provided
  if (foto_profil_base64) {
    const base64Data = foto_profil_base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const filePath = `pengrajin/${userId}/profile.${foto_profil_base64.includes("image/png") ? "png" : "jpg"}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("profile-photos")
      .upload(filePath, buffer, { contentType: "image/jpeg", upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabaseAdmin.storage.from("profile-photos").getPublicUrl(filePath);
      foto_profil_url = urlData.publicUrl;
    }
  }

  // 3. Insert pengrajin profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("pengrajin")
    .insert({
      id: userId,
      nama,
      email,
      nomor_telepon,
      foto_profil_url,
      kota,
      kabupaten,
      alamat,
    })
    .select()
    .single();

  if (profileError) {
    // Rollback: delete auth user
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return errorResponse("Gagal membuat profil pengrajin", 500, profileError.message);
  }

  return jsonResponse({
    user: { id: userId, email, role: "pengrajin" },
    profile,
  }, 201);
}

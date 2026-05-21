import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";
import type { RegisterUmkmRequest } from "@/lib/types";

export async function POST(request: Request) {
  const body: RegisterUmkmRequest = await request.json();
  const { nama_penjual, nama_toko, email, nomor_telepon, password, kota, kabupaten, alamat, foto_profil_base64, npwp_nib } = body;

  if (!nama_penjual || !nama_toko || !email || !nomor_telepon || !password || !kota || !kabupaten || !alamat) {
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
    user_metadata: { role: "umkm", nama: nama_penjual },
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
    const filePath = `umkm/${userId}/profile.${foto_profil_base64.includes("image/png") ? "png" : "jpg"}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from("profile-photos")
      .upload(filePath, buffer, { contentType: "image/jpeg", upsert: true });

    if (!uploadError) {
      const { data: urlData } = supabaseAdmin.storage.from("profile-photos").getPublicUrl(filePath);
      foto_profil_url = urlData.publicUrl;
    }
  }

  // 3. Insert umkm profile
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("umkm")
    .insert({
      id: userId,
      nama_penjual,
      nama_toko,
      email,
      nomor_telepon,
      foto_profil_url,
      kota,
      kabupaten,
      alamat,
      npwp_nib: npwp_nib || null,
    })
    .select()
    .single();

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return errorResponse("Gagal membuat profil UMKM", 500, profileError.message);
  }

  return jsonResponse({
    user: { id: userId, email, role: "umkm" },
    profile,
  }, 201);
}

import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";

export async function POST(request: Request) {
  // 1. Verify auth
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return errorResponse("Token tidak ditemukan", 401);
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: verifyError } = await supabaseAdmin.auth.getUser(token);

  if (verifyError || !userData.user) {
    return errorResponse("Token tidak valid", 401);
  }

  const userId = userData.user.id;
  const role = userData.user.user_metadata?.role as string;

  // 2. Parse FormData
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return errorResponse("File tidak ditemukan", 400);
  }

  if (!file.type.startsWith("image/")) {
    return errorResponse("File harus berupa gambar", 400);
  }

  if (file.size > 5 * 1024 * 1024) {
    return errorResponse("Ukuran file maksimal 5MB", 400);
  }

  // 3. Upload to Supabase Storage
  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `${role}/${userId}/profile.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabaseAdmin.storage
    .from("profile-photos")
    .upload(filePath, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return errorResponse("Gagal mengupload foto", 500, uploadError.message);
  }

  // 4. Get public URL
  const { data: urlData } = supabaseAdmin.storage.from("profile-photos").getPublicUrl(filePath);
  const foto_profil_url = urlData.publicUrl;

  // 5. Update profile table
  const table = role === "pengrajin" ? "pengrajin" : "umkm";
  await supabaseAdmin.from(table).update({ foto_profil_url }).eq("id", userId);

  return jsonResponse({ foto_profil_url });
}

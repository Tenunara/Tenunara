import { supabaseAdmin } from "@/lib/supabase/admin";
import { jsonResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("fabric_types")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return errorResponse("Gagal memuat data jenis kain", 500, error.message);
  }

  return jsonResponse({ data });
}

import { supabaseAdmin } from "@/lib/supabase/admin";
import { generateEmbedding } from "@/lib/embedding";

const GRADE_DESC: Record<string, string> = {
  A: "kualitas premium sangat baik hampir sempurna cocok untuk produk berkualitas tinggi",
  B: "kualitas menengah baik layak pakai untuk berbagai produk kerajinan",
  C: "kualitas dasar masih dapat digunakan untuk produk sederhana atau kerajinan",
};

const SIZE_DESC: Record<string, string> = {
  lt15cm: "potongan sangat kecil berukuran di bawah 15 sentimeter",
  "15-30cm": "potongan kecil hingga sedang berukuran 15 sampai 30 sentimeter",
  "30-50cm": "potongan besar berukuran 30 sampai 50 sentimeter cocok untuk proyek yang membutuhkan kain ukuran medium",
  gt50cm: "potongan sangat besar lebih dari 50 sentimeter ideal untuk proyek yang membutuhkan kain ukuran besar",
};

const SOURCE_DESC: Record<string, string> = {
  sisa_pola: "sisa pola hasil produksi konveksi berupa potongan kain sisa dari proses pembuatan pakaian",
  cacat_maklun: "kain cacat reject dari proses maklun atau produksi garment yang tidak lolos quality control",
  akhir_roll: "sisa ujung roll kain dari pabrik tekstil sisa roll yang tidak terjual",
};

const HYGIENE_DESC: Record<string, string> = {
  clean_washed: "sudah dicuci bersih dan siap pakai langsung",
  clean_fresh_cut: "baru dipotong langsung dari produksi kondisi bersih dan segar",
  dusty: "masih berdebu perlu dibersihkan terlebih dahulu sebelum digunakan",
};

const PATTERN_DESC: Record<string, string> = {
  polos: "polos tanpa motif",
  motif: "bermotif atau bercorak dekoratif",
  batik: "motif batik tradisional Indonesia",
  stripes: "motif garis-garis atau lurik",
  checked: "motif kotak-kotak atau checkered",
  other: "motif khusus atau unik",
};

/** Menentukan probabilitas tinggi/rendahnya harga berdasarkan harga per kg produk */
function getPriceTier(pricePerKg: number): string {
  if (pricePerKg <= 15000) return "terjangkau dengan harga ekonomis";
  if (pricePerKg <= 35000) return "menengah dengan harga standar";
  if (pricePerKg <= 70000) return "premium dengan harga lebih tinggi";
  return "eksklusif dengan harga premium";
}

const SIZE_TERMS: Record<string, string> = {
  lt15cm: "potongan kecil",
  "15-30cm": "potongan sedang",
  "30-50cm": "potongan besar",
  gt50cm: "potongan sangat besar",
};

const FABRIC_SYNONYMS: Record<string, string[]> = {
  "Katun Combed": ["katun combed", "kain katun combed", "cotton combed", "kaus", "kaos", "t-shirt fabric"],
  "Katun Carded": ["katun carded", "kain katun carded", "cotton carded", "carded"],
  Denim: ["denim", "jeans", "jins", "jean", "kain denim", "celana jeans"],
  Rayon: ["rayon", "kain rayon", "viscose", "viscose rayon", "sutra buatan"],
  Polyester: ["polyester", "poliester", "kain polyester", "sintetis"],
  Drill: ["drill", "kain drill", "drill cotton", "celana bahan"],
  Spandex: ["spandex", "elastis", "stretch", "lycra", "kain spandex"],
  Linen: ["linen", "kain linen", "ramie", "lenan"],
  Sutra: ["sutra", "silk", "kain sutra"],
  "Katun Oxford": ["oxford", "katun oxford", "kemeja oxford"],
  "TC (Tetoron Cotton)": ["tc", "tetoron cotton", "kain tc", "tetoron"],
  "CVC (Cotton Viscose)": ["cvc", "cotton viscose", "kain cvc"],
};

function getColorName(colorStr: string | null | undefined): string {
  if (!colorStr) return "campuran warna";
  // Format: "#HEXCODE;Color Name" → "Color Name"
  const afterHex = colorStr.split(";").pop() ?? colorStr;
  return afterHex.trim();
}

function buildProductText(p: Record<string, unknown>): string {
  const fabricTypes = p.fabric_types as Record<string, unknown> | undefined;
  const umkm = p.umkm as Record<string, unknown> | undefined;
  const fabricName = fabricTypes?.name as string | undefined;
  const colorStr = getColorName(p.ai_dominant_color as string | null | undefined);

  const synonyms = fabricName ? FABRIC_SYNONYMS[fabricName] : undefined;
  const synonymText = synonyms
    ? `Jenis kain ini juga dikenal dengan istilah: ${synonyms.join(", ")}.`
    : "";

  const patternKey = String(p.ai_pattern ?? "polos");
  const grade = String(p.final_grade ?? p.ai_suggested_grade ?? "B");
  const price = Number(p.total_weight_kg) ? Number(p.price_per_kg) : 0;

  const parts = [
    [
      `Kain ${fabricName ?? "tekstil"} sisa produksi berkualitas,`,
      `terbuat dari bahan ${fabricTypes?.category ?? "tekstil"} dengan warna dominan ${colorStr}.`,
    ].join(" "),

    fabricTypes?.common_uses
      ? `Bahan ini biasa digunakan untuk membuat ${fabricTypes.common_uses}.`
      : "",

    synonymText,

    `Motif atau pola kain: ${PATTERN_DESC[patternKey] ?? patternKey}.`,

    `${SIZE_DESC[String(p.ai_size_range ?? "")] ?? p.ai_size_range ?? "Potongan tersedia dalam berbagai ukuran"}.`,

    [
      `Kualitas ${grade}: ${GRADE_DESC[grade]}.`,
      `Tersedia stok ${p.total_weight_kg} kilogram dengan harga Rp${Number(price).toLocaleString("id-ID")} per kilogram (${getPriceTier(price)}).`,
    ].join(" "),

    p.minimum_order_kg
      ? `Pembelian minimal ${p.minimum_order_kg} kilogram.`
      : "Tidak ada minimum pembelian, bisa beli satuan kilogram.",

    p.is_negotiable
      ? "Harga dapat dinegosiasikan untuk pembelian dalam jumlah besar."
      : "Harga sudah tetap dan tidak dapat dinegosiasikan.",

    `Sumber kain: ${SOURCE_DESC[String(p.production_source ?? "")] ?? p.production_source}.`,
    `Kondisi kain: ${HYGIENE_DESC[String(p.hygiene_status ?? "")] ?? p.hygiene_status}.`,
    p.has_odor
      ? "Kain memiliki sedikit bau khas produksi yang akan hilang setelah dicuci."
      : "Kain dalam kondisi tidak berbau segar dan bersih.",

    umkm?.nama_toko || umkm?.kota
      ? `Dijual oleh ${umkm?.nama_toko ?? "penjual"} yang berlokasi di ${[umkm?.kota, umkm?.kabupaten].filter(Boolean).join(", ")}.`
      : "",

    p.notes ? `Catatan dari penjual: ${p.notes}.` : "",

    `Kata kunci: kain sisa ${fabricName ?? "tekstil"} grade ${grade} warna ${colorStr} ${patternKey} loc ${umkm?.kota ?? ""} ${(Number(p.total_weight_kg) || 0) >= 5 ? "partai besar grosir" : "eceran partai kecil"}.`,
  ];

  return parts.filter(Boolean).join(" ");
}

export async function indexProductEmbedding(productId: string) {
  const { data: product, error } = await supabaseAdmin
    .from("products")
    .select(
      `*,
       fabric_types(name, category, common_uses),
       umkm!inner(kota, kabupaten, nama_toko)`,
    )
    .eq("id", productId)
    .single();

  if (error || !product) {
    throw new Error("Product not found");
  }

  const productText = buildProductText(product as Record<string, unknown>);
  const embedding = await generateEmbedding(productText, "document");

  const { error: updateError } = await supabaseAdmin
    .from("products")
    .update({ search_embedding: embedding })
    .eq("id", productId);

  if (updateError) {
    throw new Error("Gagal menyimpan embedding");
  }
}

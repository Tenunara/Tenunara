import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// ─── Simple .env parser ──────────────────────────────────────────────
function loadEnv() {
  try {
    const envFile = readFileSync(".env", "utf8");
    envFile.split("\n").forEach((line) => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts
          .join("=")
          .trim()
          .replace(/^"(.*)"$/, "$1");
      }
    });
  } catch {
    console.warn("Could not load .env file, relying on existing environment variables");
  }
}

loadEnv();

// ─── Supabase Admin Client ──────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Constants (from semantic-indexing.ts) ────────────────────────────
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

function getPriceTier(pricePerKg: number): string {
  if (pricePerKg <= 15000) return "terjangkau dengan harga ekonomis";
  if (pricePerKg <= 35000) return "menengah dengan harga standar";
  if (pricePerKg <= 70000) return "premium dengan harga lebih tinggi";
  return "eksklusif dengan harga premium";
}

function getColorName(colorStr: string | null | undefined): string {
  if (!colorStr) return "campuran warna";
  const afterHex = colorStr.split(";").pop() ?? colorStr;
  return afterHex.trim();
}

function buildProductText(
  product: Record<string, unknown>,
  fabricTypes: Record<string, unknown> | null,
  umkm: Record<string, unknown> | null,
): string {
  const fabricName = fabricTypes?.name as string | undefined;
  const colorStr = getColorName(product.ai_dominant_color as string | null | undefined);

  const synonyms = fabricName ? FABRIC_SYNONYMS[fabricName] : undefined;
  const synonymText = synonyms
    ? `Jenis kain ini juga dikenal dengan istilah: ${synonyms.join(", ")}.`
    : "";

  const patternKey = String(product.ai_pattern ?? "polos");
  const grade = String(product.final_grade ?? product.ai_suggested_grade ?? "B");
  const price = Number(product.total_weight_kg) ? Number(product.price_per_kg) : 0;

  const parts = [
    `Kain ${fabricName ?? "tekstil"} sisa produksi berkualitas, terbuat dari bahan ${fabricTypes?.category ?? "tekstil"} dengan warna dominan ${colorStr}.`,
    fabricTypes?.common_uses
      ? `Bahan ini biasa digunakan untuk membuat ${fabricTypes.common_uses}.`
      : "",
    synonymText,
    `Motif atau pola kain: ${PATTERN_DESC[patternKey] ?? patternKey}.`,
    `${SIZE_DESC[String(product.ai_size_range ?? "")] ?? product.ai_size_range ?? "Potongan tersedia dalam berbagai ukuran"}.`,
    `Kualitas ${grade}: ${GRADE_DESC[grade]}. Tersedia stok ${product.total_weight_kg} kilogram dengan harga Rp${Number(price).toLocaleString("id-ID")} per kilogram (${getPriceTier(price)}).`,
    product.minimum_order_kg
      ? `Pembelian minimal ${product.minimum_order_kg} kilogram.`
      : "Tidak ada minimum pembelian, bisa beli satuan kilogram.",
    product.is_negotiable
      ? "Harga dapat dinegosiasikan untuk pembelian dalam jumlah besar."
      : "Harga sudah tetap dan tidak dapat dinegosiasikan.",
    `Sumber kain: ${SOURCE_DESC[String(product.production_source ?? "")] ?? product.production_source}.`,
    `Kondisi kain: ${HYGIENE_DESC[String(product.hygiene_status ?? "")] ?? product.hygiene_status}.`,
    product.has_odor
      ? "Kain memiliki sedikit bau khas produksi yang akan hilang setelah dicuci."
      : "Kain dalam kondisi tidak berbau segar dan bersih.",
    umkm?.nama_toko || umkm?.kota
      ? `Dijual oleh ${umkm?.nama_toko ?? "penjual"} yang berlokasi di ${[umkm?.kota, umkm?.kabupaten].filter(Boolean).join(", ")}.`
      : "",
    product.notes ? `Catatan dari penjual: ${product.notes}.` : "",
    `Kata kunci: kain sisa ${fabricName ?? "tekstil"} grade ${grade} warna ${colorStr} ${patternKey} loc ${umkm?.kota ?? ""} ${(Number(product.total_weight_kg) || 0) >= 5 ? "partai besar grosir" : "eceran partai kecil"}.`,
  ];

  return parts.filter(Boolean).join(" ");
}

// ─── Generate Embedding via Voyage AI ─────────────────────────────────
async function generateEmbedding(text: string): Promise<number[]> {
  const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
  if (!VOYAGE_API_KEY) throw new Error("VOYAGE_API_KEY tidak dikonfigurasi");

  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "voyage-3.5-lite",
      input: [text],
      input_type: "document",
      output_dimension: 1024,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("Voyage API error:", data);
    throw new Error("Embedding failed");
  }

  return data.data[0].embedding as number[];
}

// ─── Batch Processing ─────────────────────────────────────────────────
const CONCURRENCY = 1; // Voyage free tier: 3 RPM — sequential is safest
const SLEEP_MS = 22_000; // ~22 detik antar request (3 RPM + safety margin)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateAndUpdate(
  product: Record<string, unknown>,
  fabricTypesMap: Map<number, Record<string, unknown>>,
  umkmMap: Map<string, Record<string, unknown>>,
): Promise<boolean> {
  const productId = product.id as string;
  const umkmId = product.umkm_id as string;
  const fabricTypeId = product.fabric_type_id as number;

  const ft = fabricTypesMap.get(fabricTypeId) ?? null;
  const u = umkmMap.get(umkmId) ?? null;

  if (!u) {
    console.error(`  ✗ ${productId}: umkm ${umkmId} tidak ditemukan`);
    return false;
  }

  try {
    const productText = buildProductText(product, ft, u);
    const embedding = await generateEmbedding(productText);

    const { error: updateError } = await supabase
      .from("products")
      .update({ search_embedding: embedding } as never)
      .eq("id", productId);

    if (updateError) {
      console.error(`  ✗ ${productId}: update gagal — ${updateError.message}`);
      return false;
    }

    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    console.error(`  ✗ ${productId}: ${msg}`);
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log("=".repeat(60));
  console.log("  Backfill search_embedding untuk produk yang NULL");
  console.log("=".repeat(60));

  // Count total missing
  const { count: totalMissing, error: countErr } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .is("search_embedding", null);

  if (countErr) {
    console.error("Gagal menghitung produk:", countErr.message);
    process.exit(1);
  }

  console.log(`\nProduk dengan search_embedding NULL: ${totalMissing ?? 0}\n`);

  if (!totalMissing || totalMissing === 0) {
    console.log("✅ Semua produk sudah memiliki search_embedding. Tidak perlu backfill.");
    return;
  }

  // Fetch all products with NULL embedding (without joins)
  const { data: allProducts, error: productsError } = await supabase
    .from("products")
    .select("*")
    .is("search_embedding", null);

  if (productsError || !allProducts || allProducts.length === 0) {
    console.error("Gagal fetch produk:", productsError?.message);
    process.exit(1);
  }

  console.log(`  Fetching referensi fabric_types dan umkm...`);

  // Collect unique IDs
  const fabricTypeIds = [...new Set(allProducts.map((p) => p.fabric_type_id as number))];
  const umkmIds = [...new Set(allProducts.map((p) => p.umkm_id as string))];

  // Batch-fetch fabric_types
  const { data: allFabricTypes } = await supabase
    .from("fabric_types")
    .select("*")
    .in("id", fabricTypeIds);

  const fabricTypesMap = new Map<number, Record<string, unknown>>();
  for (const ft of allFabricTypes ?? []) {
    fabricTypesMap.set(ft.id as number, ft as Record<string, unknown>);
  }

  // Batch-fetch umkm
  const { data: allUmkm } = await supabase
    .from("umkm")
    .select("id, kota, kabupaten, nama_toko")
    .in("id", umkmIds);

  const umkmMap = new Map<string, Record<string, unknown>>();
  for (const u of allUmkm ?? []) {
    umkmMap.set(u.id as string, u as Record<string, unknown>);
  }

  console.log(`  fabric_types: ${fabricTypesMap.size}, umkm: ${umkmMap.size}`);
  console.log();

  // Process products in concurrent chunks
  let success = 0;
  let failed = 0;

  for (let i = 0; i < allProducts.length; i += CONCURRENCY) {
    const chunk = allProducts.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map((p) => generateAndUpdate(p as Record<string, unknown>, fabricTypesMap, umkmMap)),
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        success++;
        process.stdout.write(".");
      } else {
        failed++;
        process.stdout.write("x");
      }
    }

    // Rate limit: Voyage free tier = 3 RPM
    if (i + CONCURRENCY < allProducts.length) {
      await sleep(SLEEP_MS);
    }

    if ((i + chunk.length) % 30 === 0 || i + chunk.length >= allProducts.length) {
      process.stdout.write(`  ${i + chunk.length}/${allProducts.length} (✓ ${success} ✗ ${failed})\n`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`  Selesai! Diproses: ${allProducts.length}`);
  console.log(`  Berhasil: ${success}`);
  console.log(`  Gagal:    ${failed}`);

  if (failed > 0) {
    console.log("\n⚠️  Beberapa produk gagal. Jalankan ulang script untuk retry.");
  }
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

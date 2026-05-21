import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { randomUUID } from "crypto";

// Simple .env parser to avoid 'dotenv' dependency
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
  } catch (err) {
    console.warn(
      "Could not load .env file, relying on existing environment variables",
    );
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const MAIN_UMKM_ID = "12948436-068b-4b9e-b18a-8788677fdeab";
const MAIN_PENGRAJIN_ID = "22948436-068b-4b9e-b18a-8788677fdeac"; // Different ID
const DUMMY_IMAGE = "/dummy1.png";

/**
 * Generates a dummy 1024-dimensional normalized vector.
 * This is "good enough" for development without calling real APIs.
 */
function generateDummyEmbedding() {
  const vec = Array.from({ length: 1024 }, () => Math.random() * 2 - 1);
  const magnitude = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  return vec.map((v) => v / magnitude);
}

async function seed() {
  console.log("🚀 Starting seeding...");

  // 1. Setup Main UMKM Account
  console.log("Setting up main UMKM user...");
  await supabase.auth.admin.createUser({
    id: MAIN_UMKM_ID,
    email: "umkm@email.com",
    password: "password123",
    email_confirm: true,
    user_metadata: { role: "umkm" },
  });

  await supabase.from("umkm").upsert({
    id: MAIN_UMKM_ID,
    nama_penjual: "Bapak Penjual",
    nama_toko: "UMKM Sukses",
    email: "umkm@email.com",
    nomor_telepon: "08123456789",
    kota: "Bandung",
    kabupaten: "Kab. Bandung",
    alamat:
      "Jl. Pasirkaliki No. 25-27, Paskal Hyper Square, Bandung, Jawa Barat 40181",
    skala_usaha: "kecil",
  });

  // 2. Setup Main Pengrajin Account
  console.log("Setting up main Pengrajin user...");
  await supabase.auth.admin.createUser({
    id: MAIN_PENGRAJIN_ID,
    email: "pengerajin@email.com",
    password: "password123",
    email_confirm: true,
    user_metadata: { role: "pengrajin" },
  });

  await supabase.from("pengrajin").upsert({
    id: MAIN_PENGRAJIN_ID,
    nama: "Mas Pengerajin",
    email: "pengerajin@email.com",
    nomor_telepon: "081122334455",
    kota: "Bandung",
    kabupaten: "Kab. Bandung",
    alamat:
      "Jl. Sentra Dago Pakar Raya Blok F-2, Komplek Dago Pakar, Mekarsaluyu, Kec. Cimenyan, Kabupaten Bandung",
  });

  // 4. Seed extra users for "LOT of data"
  console.log("Seeding extra users...");
  const extraUserIds: string[] = [];
  for (let i = 0; i < 10; i++) {
    const id = randomUUID();
    const { data: newUser } = await supabase.auth.admin.createUser({
      id,
      email: `user${i}@example.com`,
      password: "password123",
      email_confirm: true,
    });

    if (newUser.user) {
      extraUserIds.push(newUser.user.id);

      if (i % 2 === 0) {
        await supabase.from("umkm").upsert({
          id: newUser.user.id,
          nama_penjual: `Penjual ${i}`,
          nama_toko: `Toko ${i}`,
          email: `umkm${i}@example.com`,
          nomor_telepon: `081234567${i}`,
          kota: "Jakarta",
          kabupaten: "Jakarta Selatan",
          alamat: `Alamat Toko ${i}`,
          skala_usaha: i % 3 === 0 ? "mikro" : "kecil",
        });
      } else {
        await supabase.from("pengrajin").upsert({
          id: newUser.user.id,
          nama: `Pengrajin ${i}`,
          email: `pengrajin${i}@example.com`,
          nomor_telepon: `082134567${i}`,
          kota: "Solo",
          kabupaten: "Surakarta",
          alamat: `Alamat Pengrajin ${i}`,
        });
      }
    }
  }

  // 5. Get Fabric Types
  const { data: fabricTypes } = await supabase
    .from("fabric_types")
    .select("id");
  const fabricTypeIds = fabricTypes?.map((f) => f.id) || [1, 2, 3];

  // 6. Seed Products
  console.log("Seeding products...");
  const umkmIds = [
    MAIN_UMKM_ID,
    ...extraUserIds.filter((_, i) => i % 2 === 0),
  ];
  const productIds: string[] = [];

  for (const umkmId of umkmIds) {
    const numProducts = 25; // More products
    for (let j = 0; j < numProducts; j++) {
      const productId = randomUUID();
      const { error: pError } = await supabase.from("products").insert({
        id: productId,
        umkm_id: umkmId,
        fabric_type_id:
          fabricTypeIds[Math.floor(Math.random() * fabricTypeIds.length)],
        production_source: ["sisa_pola", "cacat_maklun", "akhir_roll"][
          Math.floor(Math.random() * 3)
        ],
        hygiene_status: ["clean_washed", "clean_fresh_cut", "dusty"][
          Math.floor(Math.random() * 3)
        ],
        total_weight_kg: 5 + Math.random() * 50,
        price_per_kg: 15000 + Math.floor(Math.random() * 85000),
        status: "published",
        images_url: [DUMMY_IMAGE],
        ai_suggested_grade: ["A", "B", "C"][Math.floor(Math.random() * 3)],
        final_grade: ["A", "B", "C"][Math.floor(Math.random() * 3)],
        ai_reasoning: "Hasil analisis AI menunjukkan kualitas kain yang stabil.",
        ai_confidence_score: 0.85,
        ai_pattern: ["polos", "motif", "batik"][Math.floor(Math.random() * 3)],
        ai_size_range: ["15-30cm", "30-50cm", "gt50cm"][
          Math.floor(Math.random() * 3)
        ],
        search_embedding: generateDummyEmbedding(),
      });

      if (!pError) {
        productIds.push(productId);
        // Seed defect details for some products
        if (Math.random() > 0.5) {
          await supabase.from("product_defect_details").insert({
            product_id: productId,
            defect_type: ["noda", "sobek", "lubang"][
              Math.floor(Math.random() * 3)
            ],
            defect_percentage: 2 + Math.random() * 10,
            confidence_score: 0.9,
          });
        }
      }
    }
  }

  // 7. Seed Orders and Transactions
  console.log("Seeding orders and transactions...");
  const pengrajinIds = [
    MAIN_PENGRAJIN_ID,
    ...extraUserIds.filter((_, i) => i % 2 !== 0),
  ];


  for (const pengrajinId of pengrajinIds) {
    const numOrders = 8; // More orders
    for (let k = 0; k < numOrders; k++) {
      const targetUmkmId = umkmIds[Math.floor(Math.random() * umkmIds.length)];
      if (pengrajinId === targetUmkmId && pengrajinIds.length > 1) continue;

      const orderId = randomUUID();
      const subtotal = 100000 + Math.floor(Math.random() * 500000);
      const shipping = 25000;
      const appFee = subtotal * 0.05;
      const total = subtotal + shipping + appFee;
      const status = [
        "pending_payment",
        "awaiting_shipment",
        "in_verification",
        "completed",
      ][Math.floor(Math.random() * 4)];

      const { error: oError } = await supabase.from("orders").insert({
        id: orderId,
        pengrajin_id: pengrajinId,
        umkm_id: targetUmkmId,
        status: status,
        subtotal,
        shipping_cost: shipping,
        app_fee: appFee,
        grand_total: total,
      });

      if (!oError) {
        const randomProduct =
          productIds[Math.floor(Math.random() * productIds.length)];
        await supabase.from("order_items").insert({
          order_id: orderId,
          product_id: randomProduct,
          quantity_kg: 5,
          price_per_kg: subtotal / 5,
          subtotal: subtotal,
        });

        await supabase.from("order_status_history").insert({
          order_id: orderId,
          from_status: null,
          to_status: status,
          notes: "Status awal dari seeder",
        });

        await supabase.from("escrow_transactions").insert({
          order_id: orderId,
          amount: total,
          status: status === "completed" ? "released" : "held",
        });

        await supabase.from("waste_diversion_logs").insert({
          order_id: orderId,
          umkm_id: targetUmkmId,
          total_weight_kg: 5,
        });
      }
    }
  }

  console.log("✅ Seeding completed!");
}

seed().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});

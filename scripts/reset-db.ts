import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

function loadEnv() {
  try {
    const envFile = readFileSync('.env', 'utf8');
    envFile.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim().replace(/^"(.*)"$/, '$1');
      }
    });
  } catch (err) {}
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function reset() {
  console.log('🧹 Starting database cleanup...');

  // Tables to clear in order of dependencies (to avoid FK violations)
  const tables = [
    'escrow_transactions',
    'order_disputes',
    'order_items',
    'order_status_history',
    'waste_diversion_logs',
    'stock_reservations',
    'orders',
    'product_defect_details',
    'products',
    'pengrajin',
    'umkm',
    'fabric_types'
  ];

  for (const table of tables) {
    console.log(`Cleaning table: ${table}...`);
    // Delete all rows. Since we use service_role, RLS is bypassed.
    // We use a filter that matches all rows (e.g., .neq for UUID/ID)
    const { error } = await supabase.from(table).delete().neq('id', -1 as any); 
    // Note: for UUID tables, -1 might fail if it strictly validates UUID format, 
    // but .neq('id', '00000000-0000-0000-0000-000000000000') usually works.
    
    if (error) {
      // Fallback for different ID types
      const { error: error2 } = await supabase.from(table).delete().not('created_at', 'is', null);
      if (error2) console.error(`Failed to clean ${table}:`, error2.message);
    }
  }

  console.log('🌿 Re-seeding fabric types...');
  const fabricTypes = [
    { name: 'Katun Combed', category: 'natural', common_uses: 'kaos, jersey, pakaian sehari-hari' },
    { name: 'Katun Carded', category: 'natural', common_uses: 'kaos murah, seragam, kemeja' },
    { name: 'Denim', category: 'natural', common_uses: 'celana, jaket, tas, aksesoris' },
    { name: 'Rayon', category: 'natural', common_uses: 'kemeja, dress, blus, scarf' },
    { name: 'Polyester', category: 'synthetic', common_uses: 'jaket, seragam olahraga, tas' },
    { name: 'Drill', category: 'natural', common_uses: 'seragam kerja, celana, jaket' },
    { name: 'Spandex', category: 'synthetic', common_uses: 'legging, pakaian olahraga, kaos ketat' },
    { name: 'Nylon', category: 'synthetic', common_uses: 'jaket, tas, payung, sepatu' },
    { name: 'Kanvas', category: 'natural', common_uses: 'tas, sepatu, jaket, dompet' },
    { name: 'Sutra', category: 'natural', common_uses: 'kebaya, dress, scarf, batik' },
    { name: 'Wol', category: 'natural', common_uses: 'jaket, sweater, syal, blazer' },
    { name: 'Linen', category: 'natural', common_uses: 'kemeja, dress, celana, taplak' },
    { name: 'CVC (Cotton Viscose)', category: 'blend', common_uses: 'seragam, kemeja, pakaian kerja' },
    { name: 'TC (Tetoron Cotton)', category: 'blend', common_uses: 'seragam, kemeja, jas laboratorium' },
    { name: 'Cotton Polyester', category: 'blend', common_uses: 'kaos, jaket, seragam, pakaian pakaian anak' }
  ];

  const { error: seedError } = await supabase.from('fabric_types').insert(fabricTypes);
  if (seedError) {
    console.error('Error seeding fabric types:', seedError.message);
  } else {
    console.log('✅ Database reset and fabric types seeded!');
  }

  console.log('\n⚠️ NOTE: Auto-increment counters were NOT reset because Supabase client doesn\'t support TRUNCATE.');
  console.log('To truly reset counters, please run the TRUNCATE SQL command in the Supabase Dashboard SQL Editor.');
}

reset().catch(err => {
  console.error('❌ Reset failed:', err);
  process.exit(1);
});

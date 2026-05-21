-- ============================================================
-- TENUNARA — Supabase Migration: Products & AI Analysis
-- Jalankan SQL ini di Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. MASTER DATA: FABRIC TYPES
CREATE TABLE IF NOT EXISTS fabric_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('natural', 'synthetic', 'blend')),
  common_uses VARCHAR(100)
);

-- Seed fabric types
INSERT INTO fabric_types (name, category, common_uses) VALUES
  ('Katun Combed', 'natural', 'kaos, jersey, pakaian sehari-hari'),
  ('Katun Carded', 'natural', 'kaos murah, seragam, kemeja'),
  ('Denim', 'natural', 'celana, jaket, tas, aksesoris'),
  ('Rayon', 'natural', 'kemeja, dress, blus, scarf'),
  ('Polyester', 'synthetic', 'jaket, seragam olahraga, tas'),
  ('Drill', 'natural', 'seragam kerja, celana, jaket'),
  ('Spandex', 'synthetic', 'legging, pakaian olahraga, kaos ketat'),
  ('Nylon', 'synthetic', 'jaket, tas, payung, sepatu'),
  ('Kanvas', 'natural', 'tas, sepatu, jaket, dompet'),
  ('Sutra', 'natural', 'kebaya, dress, scarf, batik'),
  ('Wol', 'natural', 'jaket, sweater, syal, blazer'),
  ('Linen', 'natural', 'kemeja, dress, celana, taplak'),
  ('CVC (Cotton Viscose)', 'blend', 'seragam, kemeja, pakaian kerja'),
  ('TC (Tetoron Cotton)', 'blend', 'seragam, kemeja, jas laboratorium'),
  ('Cotton Polyester', 'blend', 'kaos, jaket, seragam, pakaian anak')
ON CONFLICT (name) DO NOTHING;

-- 2. MAIN TABLE: PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  umkm_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fabric_type_id INTEGER NOT NULL REFERENCES fabric_types(id),
  fiber_composition VARCHAR(100),
  images_url JSON NOT NULL DEFAULT '[]'::json,
  production_source TEXT NOT NULL CHECK (production_source IN ('sisa_pola', 'cacat_maklun', 'akhir_roll')),
  hygiene_status TEXT NOT NULL CHECK (hygiene_status IN ('clean_washed', 'clean_fresh_cut', 'dusty')),
  has_odor BOOLEAN NOT NULL DEFAULT false,
  total_weight_kg NUMERIC(5,2) NOT NULL CHECK (total_weight_kg >= 0.5),
  estimated_pieces INTEGER CHECK (estimated_pieces > 0),
  price_per_kg NUMERIC(10,2) NOT NULL CHECK (price_per_kg > 0),
  is_negotiable BOOLEAN NOT NULL DEFAULT false,
  minimum_order_kg NUMERIC(5,2) CHECK (minimum_order_kg IS NULL OR minimum_order_kg > 0),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 300),
  -- AI fields
  ai_dominant_color VARCHAR(30),
  ai_pattern TEXT CHECK (ai_pattern IS NULL OR ai_pattern IN ('polos', 'motif', 'batik', 'stripes', 'checked', 'other')),
  ai_size_range TEXT CHECK (ai_size_range IS NULL OR ai_size_range IN ('lt15cm', '15-30cm', '30-50cm', 'gt50cm')),
  ai_confidence_score NUMERIC(3,2) CHECK (ai_confidence_score IS NULL OR (ai_confidence_score >= 0 AND ai_confidence_score <= 1)),
  ai_suggested_grade CHAR(1) CHECK (ai_suggested_grade IS NULL OR ai_suggested_grade IN ('A', 'B', 'C')),
  ai_reasoning TEXT,
  ai_model_version VARCHAR(20),
  ai_processed_at TIMESTAMPTZ,
  -- Final grade (starts same as AI, can be overridden by UMKM)
  final_grade CHAR(1) CHECK (final_grade IS NULL OR final_grade IN ('A', 'B', 'C')),
  is_grade_overridden BOOLEAN NOT NULL DEFAULT false,
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'published', 'sold', 'dispute', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. PRODUCT DEFECT DETAILS (AI-detected)
CREATE TABLE IF NOT EXISTS product_defect_details (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  defect_type TEXT NOT NULL CHECK (defect_type IN ('noda', 'sobek', 'lubang', 'warna_pudar', 'cacat_tenun')),
  defect_percentage NUMERIC(5,2) NOT NULL CHECK (defect_percentage >= 0 AND defect_percentage <= 100),
  confidence_score NUMERIC(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  detected_at TIMESTAMPTZ DEFAULT now()
);

-- 4. AUTO-UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_products') THEN
    CREATE TRIGGER set_updated_at_products
      BEFORE UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- 5. ROW LEVEL SECURITY
ALTER TABLE fabric_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_defect_details ENABLE ROW LEVEL SECURITY;

-- Fabric types: public read, only service_role write
CREATE POLICY "fabric_types_select_all" ON fabric_types
  FOR SELECT USING (true);

-- Products: UMKM can manage own products, anyone can read published
CREATE POLICY "products_select_published" ON products
  FOR SELECT USING (status = 'published');

CREATE POLICY "products_select_own" ON products
  FOR SELECT USING (auth.uid() = umkm_id);

CREATE POLICY "products_insert_own" ON products
  FOR INSERT WITH CHECK (auth.uid() = umkm_id);

CREATE POLICY "products_update_own" ON products
  FOR UPDATE USING (auth.uid() = umkm_id);

CREATE POLICY "products_delete_own" ON products
  FOR DELETE USING (auth.uid() = umkm_id);

-- Defect details: public read, inserted with product
CREATE POLICY "defect_details_select" ON product_defect_details
  FOR SELECT USING (true);

CREATE POLICY "defect_details_insert" ON product_defect_details
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM products WHERE id = product_id AND umkm_id = auth.uid())
  );

-- 6. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('product-images', 'product-images', true, false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product_images_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "product_images_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "product_images_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND auth.uid() = owner
  );

CREATE POLICY "product_images_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND auth.uid() = owner
  );

-- 7. INDEXES
CREATE INDEX IF NOT EXISTS idx_products_umkm_id ON products(umkm_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_fabric_type ON products(fabric_type_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_defect_details_product ON product_defect_details(product_id);

-- ============================================================
-- SELESAI
-- ============================================================

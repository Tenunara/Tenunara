-- ============================================================
-- TENUNARA — Supabase Migration: Semantic Search (pgvector)
-- Jalankan SQL ini di Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add embedding column to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_embedding vector(1024);

-- 3. Index for similarity search performance
CREATE INDEX IF NOT EXISTS idx_products_embedding
  ON products
  USING ivfflat (search_embedding vector_cosine_ops)
  WITH (lists = 100);

-- 4. Search queries log table
CREATE TABLE IF NOT EXISTS search_queries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengrajin_id UUID REFERENCES pengrajin(id) ON DELETE SET NULL,
  raw_query   TEXT NOT NULL,
  parsed_params JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- 5. Match cache table (TTL 30 minutes)
CREATE TABLE IF NOT EXISTS match_cache (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key   TEXT NOT NULL UNIQUE,
  results     JSONB NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_cache_key ON match_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_match_cache_expires ON match_cache(expires_at);

-- 6. Cache cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM match_cache WHERE expires_at < now();
END;
$$;

-- 7. Vector search RPC function
CREATE OR REPLACE FUNCTION match_products(
  query_embedding   vector(1024),
  p_fabric_type     TEXT    DEFAULT NULL,
  p_min_weight      NUMERIC DEFAULT NULL,
  p_grade           CHAR(1) DEFAULT NULL,
  p_kota_pengrajin  TEXT    DEFAULT NULL,
  p_match_count     INT     DEFAULT 10
)
RETURNS TABLE (
  product_id        UUID,
  umkm_id           UUID,
  nama_toko         TEXT,
  fabric_type_name  TEXT,
  final_grade       CHAR(1),
  total_weight_kg   NUMERIC,
  price_per_kg      NUMERIC,
  minimum_order_kg  NUMERIC,
  ai_dominant_color VARCHAR,
  ai_size_range     TEXT,
  ai_pattern        TEXT,
  kota              TEXT,
  is_negotiable     BOOLEAN,
  semantic_score    FLOAT,
  geo_boost         FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id::UUID                                    AS product_id,
    p.umkm_id::UUID                               AS umkm_id,
    u.nama_toko::TEXT                             AS nama_toko,
    ft.name::TEXT                                 AS fabric_type_name,
    p.final_grade::CHAR(1)                        AS final_grade,
    p.total_weight_kg::NUMERIC                    AS total_weight_kg,
    p.price_per_kg::NUMERIC                       AS price_per_kg,
    p.minimum_order_kg::NUMERIC                   AS minimum_order_kg,
    p.ai_dominant_color::VARCHAR                  AS ai_dominant_color,
    p.ai_size_range::TEXT                         AS ai_size_range,
    p.ai_pattern::TEXT                            AS ai_pattern,
    u.kota::TEXT                                  AS kota,
    p.is_negotiable::BOOLEAN                      AS is_negotiable,
    (1 - (p.search_embedding <=> query_embedding))::FLOAT AS semantic_score,
    CASE WHEN u.kota = p_kota_pengrajin THEN 0.1 ELSE 0.0 END::FLOAT AS geo_boost
  FROM products p
  JOIN umkm u  ON p.umkm_id = u.id
  JOIN fabric_types ft ON p.fabric_type_id = ft.id
  WHERE
    p.status = 'published'
    AND p.search_embedding IS NOT NULL
    AND p.total_weight_kg >= 0.5
    -- Hard filter: fabric type (if mentioned in query)
    AND (p_fabric_type IS NULL OR ft.name ILIKE p_fabric_type)
    -- Hard filter: minimum weight
    AND (p_min_weight IS NULL OR p.total_weight_kg >= p_min_weight)
    -- Hard filter: grade
    AND (p_grade IS NULL OR p.final_grade = p_grade)
  ORDER BY semantic_score DESC
  LIMIT p_match_count;
END;
$$;

-- 8. RLS policies for new tables
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_cache ENABLE ROW LEVEL SECURITY;

-- search_queries: insert by authenticated users, read only by service_role
CREATE POLICY "search_queries_insert" ON search_queries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "search_queries_select_service" ON search_queries
  FOR SELECT USING (auth.role() = 'service_role');

-- match_cache: full access for service_role only (managed by backend)
CREATE POLICY "match_cache_all_service" ON match_cache
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- SELESAI
-- ============================================================

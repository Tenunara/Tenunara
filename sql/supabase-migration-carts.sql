-- ============================================================
-- TENUNARA — Supabase Migration: Shopping Cart
-- ============================================================

-- 1. CARTS (satu baris per pengrajin)
CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengrajin_id UUID NOT NULL UNIQUE REFERENCES pengrajin(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CART ITEMS
CREATE TABLE IF NOT EXISTS cart_items (
  id BIGSERIAL PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity_kg NUMERIC(7,2) NOT NULL CHECK (quantity_kg > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cart_id, product_id)
);

-- 3. TRIGGERS (updated_at)
CREATE TRIGGER set_updated_at_carts
  BEFORE UPDATE ON carts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_cart_items
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. ROW LEVEL SECURITY
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Carts: pengrajin can CRUD own cart
CREATE POLICY "carts_select_own" ON carts
  FOR SELECT USING (auth.uid() = pengrajin_id);

CREATE POLICY "carts_insert_own" ON carts
  FOR INSERT WITH CHECK (auth.uid() = pengrajin_id);

-- cart_items: pengrajin manages items via their cart
CREATE POLICY "cart_items_select_own" ON cart_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM carts WHERE id = cart_id AND pengrajin_id = auth.uid())
  );

CREATE POLICY "cart_items_insert_own" ON cart_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM carts WHERE id = cart_id AND pengrajin_id = auth.uid())
  );

CREATE POLICY "cart_items_update_own" ON cart_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM carts WHERE id = cart_id AND pengrajin_id = auth.uid())
  );

CREATE POLICY "cart_items_delete_own" ON cart_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM carts WHERE id = cart_id AND pengrajin_id = auth.uid())
  );

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_carts_pengrajin_id ON carts(pengrajin_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- ============================================================
-- SELESAI
-- ============================================================

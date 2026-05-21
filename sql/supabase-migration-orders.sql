-- ============================================================
-- TENUNARA — Supabase Migration: Orders & Transactions
-- Complete order lifecycle with escrow, dispute, and ESG logging
-- ============================================================

-- ============================================================
-- 0. SEQUENCE & HELPER FUNCTIONS
-- ============================================================

-- Sequence for human-readable order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1 INCREMENT 1;

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  seq_id BIGINT;
BEGIN
  seq_id := nextval('order_number_seq');
  RETURN 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(seq_id::TEXT, 5, '0');
END;
$$;

-- Ensure updated_at trigger function exists (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- 1. MAIN TABLE: ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE DEFAULT generate_order_number(),

  -- Relasi (referencing pengrajin/umkm tables for Supabase auto-join support)
  pengrajin_id UUID NOT NULL REFERENCES pengrajin(id) ON DELETE RESTRICT,
  umkm_id UUID NOT NULL REFERENCES umkm(id) ON DELETE RESTRICT,

  -- Status lifecycle: pending_payment → awaiting_shipment → in_verification → completed
  --                                    ↕                  ↕
  --                                cancelled         dispute → completed/cancelled
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN (
      'pending_payment',
      'awaiting_shipment',
      'in_verification',
      'completed',
      'dispute',
      'cancelled'
    )),

  -- Keuangan
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  app_fee NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (app_fee >= 0),
  grand_total NUMERIC(12,2) NOT NULL CHECK (grand_total >= 0),

  -- Catatan pembeli
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 500),

  -- Pengiriman (opsional - diisi UMKM saat konfirmasi kurir)
  courier_name TEXT CHECK (courier_name IS NULL OR length(courier_name) <= 100),
  tracking_number TEXT CHECK (tracking_number IS NULL OR length(tracking_number) <= 100),

  -- Timeline penting
  payment_simulated_at TIMESTAMPTZ,
  confirmed_by_seller_at TIMESTAMPTZ,
  confirmed_by_buyer_at TIMESTAMPTZ,
  escrow_release_at TIMESTAMPTZ,    -- 3 hari setelah confirmed_by_seller_at
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT CHECK (cancellation_reason IS NULL OR length(cancellation_reason) <= 300),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. ORDER ITEMS (line items per product)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,

  quantity_kg NUMERIC(7,2) NOT NULL CHECK (quantity_kg > 0),
  price_per_kg NUMERIC(10,2) NOT NULL CHECK (price_per_kg > 0),
  subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. ORDER STATUS HISTORY (audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_status_history (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT CHECK (notes IS NULL OR length(notes) <= 300),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. STOCK RESERVATIONS (temporary stock locking)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_reservations (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reserved_kg NUMERIC(7,2) NOT NULL CHECK (reserved_kg > 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'released', 'consumed')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. ESCROW TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'held'
    CHECK (status IN ('held', 'released', 'refunded')),
  held_at TIMESTAMPTZ DEFAULT now(),
  released_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

-- ============================================================
-- 6. ORDER DISPUTES (complaint mechanism)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES auth.users(id),
  dispute_reason TEXT NOT NULL
    CHECK (dispute_reason IN (
      'quality_not_match',
      'grade_different',
      'wrong_material',
      'damaged',
      'quantity_insufficient',
      'other'
    )),
  description TEXT NOT NULL CHECK (length(description) <= 1000),
  image_urls JSON NOT NULL DEFAULT '[]'::json,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'resolved', 'rejected')),
  resolution TEXT CHECK (resolution IS NULL OR length(resolution) <= 1000),
  resolution_type TEXT
    CHECK (resolution_type IS NULL OR resolution_type IN ('refund', 'price_adjustment', 'return', 'other')),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 7. WASTE DIVERSION LOGS (ESG / environmental impact)
-- ============================================================
CREATE TABLE IF NOT EXISTS waste_diversion_logs (
  id BIGSERIAL PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  umkm_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_weight_kg NUMERIC(10,2) NOT NULL CHECK (total_weight_kg > 0),
  logged_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 8. TRIGGERS
-- ============================================================

-- 8a. Auto-update updated_at on orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_orders') THEN
    CREATE TRIGGER set_updated_at_orders
      BEFORE UPDATE ON orders
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- 8b. Auto-update updated_at on order_disputes
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_order_disputes') THEN
    CREATE TRIGGER set_updated_at_order_disputes
      BEFORE UPDATE ON order_disputes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- 8c. Log status changes on orders
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_order_status ON orders;
CREATE TRIGGER trg_log_order_status
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- 8d. Handle order completion / cancellation side effects
CREATE OR REPLACE FUNCTION handle_order_finalization()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  total_kg NUMERIC(10,2);
BEGIN
  -- CASE: Completed
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Calculate total weight from order_items
    SELECT COALESCE(SUM(quantity_kg), 0) INTO total_kg
    FROM order_items WHERE order_id = NEW.id;

    -- Insert waste diversion log
    INSERT INTO waste_diversion_logs (order_id, umkm_id, total_weight_kg)
    VALUES (NEW.id, NEW.umkm_id, total_kg)
    ON CONFLICT (order_id) DO NOTHING;

    -- Release escrow to UMKM
    UPDATE escrow_transactions
    SET status = 'released', released_at = now()
    WHERE order_id = NEW.id AND status = 'held';

    -- Consume stock reservations
    UPDATE stock_reservations
    SET status = 'consumed'
    WHERE order_id = NEW.id AND status = 'active';

    -- Auto-close any open disputes
    UPDATE order_disputes
    SET status = 'resolved',
        resolution = 'Transaksi selesai, barang diterima pembeli.',
        resolution_type = 'other',
        resolved_at = now()
    WHERE order_id = NEW.id AND status = 'open';
  END IF;

  -- CASE: Cancelled
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
    -- Refund escrow (release back to buyer)
    UPDATE escrow_transactions
    SET status = 'refunded', refunded_at = now()
    WHERE order_id = NEW.id AND status = 'held';

    -- Release stock reservations
    UPDATE stock_reservations
    SET status = 'released'
    WHERE order_id = NEW.id AND status = 'active';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_handle_order_finalization ON orders;
CREATE TRIGGER trg_handle_order_finalization
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'cancelled'))
  EXECUTE FUNCTION handle_order_finalization();

-- 8e. Auto-create escrow record when payment is simulated
CREATE OR REPLACE FUNCTION create_escrow_on_payment()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'awaiting_shipment' AND (OLD.status IS DISTINCT FROM 'awaiting_shipment') THEN
    INSERT INTO escrow_transactions (order_id, amount, status, held_at)
    VALUES (NEW.id, NEW.grand_total, 'held', now())
    ON CONFLICT (order_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_escrow_on_payment ON orders;
CREATE TRIGGER trg_create_escrow_on_payment
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'awaiting_shipment')
  EXECUTE FUNCTION create_escrow_on_payment();

-- 8f. Set escrow_release_at when UMKM confirms shipment
CREATE OR REPLACE FUNCTION set_escrow_release_date()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'in_verification' AND (OLD.status IS DISTINCT FROM 'in_verification') THEN
    NEW.escrow_release_at = now() + INTERVAL '3 days';
    NEW.confirmed_by_seller_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_escrow_release_date ON orders;
CREATE TRIGGER trg_set_escrow_release_date
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status = 'in_verification')
  EXECUTE FUNCTION set_escrow_release_date();

-- 8g. Auto-set confirmed_by_buyer_at when buyer confirms receipt
CREATE OR REPLACE FUNCTION set_buyer_confirmation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.confirmed_by_buyer_at = now();
    NEW.completed_at = now();
  END IF;
  IF NEW.status = 'cancelled' AND (OLD.status IS DISTINCT FROM 'cancelled') THEN
    NEW.cancelled_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_buyer_confirmation ON orders;
CREATE TRIGGER trg_set_buyer_confirmation
  BEFORE UPDATE OF status ON orders
  FOR EACH ROW
  WHEN (NEW.status IN ('completed', 'cancelled'))
  EXECUTE FUNCTION set_buyer_confirmation();

-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_diversion_logs ENABLE ROW LEVEL SECURITY;

-- ============ ORDERS ============

-- Pengrajin (buyer) can view own orders
CREATE POLICY "orders_select_pengrajin" ON orders
  FOR SELECT USING (auth.uid() = pengrajin_id);

-- UMKM (seller) can view own orders
CREATE POLICY "orders_select_umkm" ON orders
  FOR SELECT USING (auth.uid() = umkm_id);

-- Pengrajin can create orders as themselves
CREATE POLICY "orders_insert_pengrajin" ON orders
  FOR INSERT WITH CHECK (auth.uid() = pengrajin_id);

-- Both parties can update (status transitions handled by business logic)
CREATE POLICY "orders_update_pengrajin" ON orders
  FOR UPDATE USING (auth.uid() = pengrajin_id);

CREATE POLICY "orders_update_umkm" ON orders
  FOR UPDATE USING (auth.uid() = umkm_id);

-- ============ ORDER ITEMS ============

-- Visible to both parties via their orders
CREATE POLICY "order_items_select_pengrajin" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND pengrajin_id = auth.uid())
  );

CREATE POLICY "order_items_select_umkm" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND umkm_id = auth.uid())
  );

-- Inserted by system on order creation (same as order insert)
CREATE POLICY "order_items_insert" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND pengrajin_id = auth.uid())
  );

-- ============ ORDER STATUS HISTORY ============

CREATE POLICY "status_history_select_pengrajin" ON order_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND pengrajin_id = auth.uid())
  );

CREATE POLICY "status_history_select_umkm" ON order_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND umkm_id = auth.uid())
  );

-- Insert handled by trigger (system)

-- ============ STOCK RESERVATIONS ============

-- UMKM can see reservations for their products
CREATE POLICY "stock_reservations_select_umkm" ON stock_reservations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM products WHERE id = product_id AND umkm_id = auth.uid())
  );

-- Pengrajin can see reservations on their orders
CREATE POLICY "stock_reservations_select_pengrajin" ON stock_reservations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND pengrajin_id = auth.uid())
  );

-- Insert handled by system trigger / service_role

-- ============ ESCROW TRANSACTIONS ============

CREATE POLICY "escrow_select_pengrajin" ON escrow_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND pengrajin_id = auth.uid())
  );

CREATE POLICY "escrow_select_umkm" ON escrow_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND umkm_id = auth.uid())
  );

-- Insert/update handled by system triggers

-- ============ ORDER DISPUTES ============

-- Both parties can view disputes on their orders
CREATE POLICY "disputes_select_pengrajin" ON order_disputes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND pengrajin_id = auth.uid())
  );

CREATE POLICY "disputes_select_umkm" ON order_disputes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND umkm_id = auth.uid())
  );

-- Pengrajin can create disputes
CREATE POLICY "disputes_insert_pengrajin" ON order_disputes
  FOR INSERT WITH CHECK (
    auth.uid() = raised_by
    AND EXISTS (SELECT 1 FROM orders WHERE id = order_id AND pengrajin_id = auth.uid())
  );

-- UMKM can update (add resolution context)
CREATE POLICY "disputes_update_umkm" ON order_disputes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_id AND umkm_id = auth.uid())
  );

-- ============ WASTE DIVERSION LOGS ============

-- Public read (for ESG dashboard transparency)
CREATE POLICY "waste_logs_select_all" ON waste_diversion_logs
  FOR SELECT USING (true);

-- Insert handled by trigger (system)

-- ============================================================
-- 10. INDEXES
-- ============================================================

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_pengrajin_id ON orders(pengrajin_id);
CREATE INDEX IF NOT EXISTS idx_orders_umkm_id ON orders(umkm_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_escrow_release ON orders(status, escrow_release_at)
  WHERE status = 'in_verification';

-- Order items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Status history
CREATE INDEX IF NOT EXISTS idx_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON order_status_history(created_at DESC);

-- Stock reservations
CREATE INDEX IF NOT EXISTS idx_stock_reservations_product_id ON stock_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_order_id ON stock_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_status ON stock_reservations(status, expires_at)
  WHERE status = 'active';

-- Escrow
CREATE INDEX IF NOT EXISTS idx_escrow_order_id ON escrow_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(status);

-- Disputes
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON order_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON order_disputes(status);

-- Waste logs
CREATE INDEX IF NOT EXISTS idx_waste_logs_umkm_id ON waste_diversion_logs(umkm_id);
CREATE INDEX IF NOT EXISTS idx_waste_logs_logged_at ON waste_diversion_logs(logged_at DESC);

-- ============================================================
-- 11. FUNCTION: Auto-release escrow (for scheduled jobs)
-- ============================================================
CREATE OR REPLACE FUNCTION auto_release_expired_escrow()
RETURNS TABLE(released_order_id UUID, released_order_number TEXT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH expired AS (
    UPDATE orders
    SET status = 'completed'
    WHERE status = 'in_verification'
      AND escrow_release_at <= now()
      AND id NOT IN (
        SELECT order_id FROM order_disputes WHERE status = 'open'
      )
    RETURNING id, order_number
  )
  SELECT expired.id, expired.order_number FROM expired;
END;
$$;

-- ============================================================
-- 12. FUNCTION: Check available stock for a product
-- ============================================================
CREATE OR REPLACE FUNCTION get_available_stock(product_uuid UUID)
RETURNS NUMERIC(7,2)
LANGUAGE plpgsql STABLE AS $$
DECLARE
  total NUMERIC(7,2);
  reserved NUMERIC(7,2);
BEGIN
  SELECT total_weight_kg INTO total FROM products WHERE id = product_uuid;
  SELECT COALESCE(SUM(reserved_kg), 0) INTO reserved
  FROM stock_reservations
  WHERE product_id = product_uuid AND status = 'active';
  RETURN COALESCE(total, 0) - reserved;
END;
$$;

-- ============================================================
-- SELESAI
-- ============================================================

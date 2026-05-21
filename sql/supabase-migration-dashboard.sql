-- ============================================================
-- TENUNARA — Supabase Migration: UMKM Dashboard
-- SQL untuk dashboard keberlanjutan UMKM
-- ============================================================

-- ============================================================
-- 1. ALTER TABLE umkm — tambah field legalitas
-- ============================================================

ALTER TABLE umkm ADD COLUMN IF NOT EXISTS skala_usaha TEXT
  CHECK (skala_usaha IS NULL OR skala_usaha IN ('mikro', 'kecil', 'menengah'));
-- nib = existing kolom npwp_nib
-- alamat_workshop = existing kolom alamat
-- penanggung_jawab = existing kolom nama_penjual

-- ============================================================
-- 2. CREATE VIEW umkm_waste_transaction_view
-- Audit trail lengkap dari orders + order_items + products
-- ============================================================

CREATE OR REPLACE VIEW umkm_waste_transaction_view AS
SELECT
  oi.id AS item_id,
  o.umkm_id,
  o.pengrajin_id,
  'TN-' || TO_CHAR(o.created_at, 'YYYY') || '-' || UPPER(SUBSTR(MD5(o.id::text || o.created_at::text), 1, 4)) AS transaction_id,
  o.created_at AS timestamp,
  ft.name AS material_type,
  COALESCE(p.final_grade, p.ai_suggested_grade) AS grade,
  oi.quantity_kg AS weight_kg,
  oi.price_per_kg,
  oi.subtotal,
  pr.nama AS receiver_name,
  pr.id AS receiver_id,
  o.courier_name,
  o.tracking_number,
  CASE o.status
    WHEN 'pending_payment' THEN 'menunggu_penjemputan'
    WHEN 'awaiting_shipment' THEN 'menunggu_penjemputan'
    WHEN 'in_verification' THEN 'dalam_perjalanan'
    WHEN 'completed' THEN 'terverifikasi_match'
    WHEN 'cancelled' THEN 'dibatalkan'
    WHEN 'dispute' THEN 'sengketa'
    ELSE 'menunggu_penjemputan'
  END AS verification_status,
  o.completed_at AS verified_at,
  ENCODE(SHA256((o.id::text || o.created_at::text)::bytea), 'hex') AS hash_code,
  o.id AS order_id,
  o.order_number,
  o.status AS order_status
FROM orders o
JOIN order_items oi ON oi.order_id = o.id
JOIN products p ON p.id = oi.product_id
JOIN fabric_types ft ON ft.id = p.fabric_type_id
LEFT JOIN pengrajin pr ON pr.id = o.pengrajin_id;

-- ============================================================
-- SELESAI
-- ============================================================

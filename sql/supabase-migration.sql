-- ============================================================
-- TENUNARA — Supabase Migration: Auth & Profiles
-- Jalankan SQL ini di Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. TABEL PENGRAJIN
CREATE TABLE IF NOT EXISTS pengrajin (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  nomor_telepon TEXT NOT NULL,
  foto_profil_url TEXT,
  kota TEXT NOT NULL,
  kabupaten TEXT NOT NULL,
  alamat TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABEL UMKM
CREATE TABLE IF NOT EXISTS umkm (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nama_penjual TEXT NOT NULL,
  nama_toko TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  nomor_telepon TEXT NOT NULL,
  foto_profil_url TEXT,
  kota TEXT NOT NULL,
  kabupaten TEXT NOT NULL,
  alamat TEXT NOT NULL,
  npwp_nib TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. AUTO-UPDATE updated_at TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_pengrajin') THEN
    CREATE TRIGGER set_updated_at_pengrajin
      BEFORE UPDATE ON pengrajin
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_umkm') THEN
    CREATE TRIGGER set_updated_at_umkm
      BEFORE UPDATE ON umkm
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- 4. ROW LEVEL SECURITY
ALTER TABLE pengrajin ENABLE ROW LEVEL SECURITY;
ALTER TABLE umkm ENABLE ROW LEVEL SECURITY;

-- Pengrajin: semua bisa lihat, hanya pemilik yang bisa update
CREATE POLICY "pengrajin_select_all" ON pengrajin
  FOR SELECT USING (true);

CREATE POLICY "pengrajin_update_own" ON pengrajin
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "pengrajin_delete_own" ON pengrajin
  FOR DELETE USING (auth.uid() = id);

-- UMKM: semua bisa lihat, hanya pemilik yang bisa update
CREATE POLICY "umkm_select_all" ON umkm
  FOR SELECT USING (true);

CREATE POLICY "umkm_update_own" ON umkm
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "umkm_delete_own" ON umkm
  FOR DELETE USING (auth.uid() = id);

-- INSERT via service_role (admin client) — no RLS policy needed for INSERT

-- 5. STORAGE BUCKET
-- Buat bucket profile-photos (public)
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('profile-photos', 'profile-photos', true, false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "profile_photos_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "profile_photos_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos'
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "profile_photos_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-photos'
    AND auth.uid() = owner
  );

CREATE POLICY "profile_photos_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos'
    AND auth.uid() = owner
  );

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_pengrajin_email ON pengrajin(email);
CREATE INDEX IF NOT EXISTS idx_pengrajin_kota ON pengrajin(kota);
CREATE INDEX IF NOT EXISTS idx_umkm_email ON umkm(email);
CREATE INDEX IF NOT EXISTS idx_umkm_kota ON umkm(kota);

-- ============================================================
-- SELESAI
-- ============================================================

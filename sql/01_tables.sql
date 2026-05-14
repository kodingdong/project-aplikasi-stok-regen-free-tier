-- ============================================================
-- FASE 1 - TASK 1.1: BUAT TABEL UTAMA
-- Aplikasi Stok Reagen Kimia - Free Tier
-- ============================================================
-- Jalankan file ini PERTAMA di Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension (biasanya sudah aktif di Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABEL: reagents
-- Menyimpan data master semua reagen kimia di lab
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reagents (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                TEXT NOT NULL,
    form                TEXT NOT NULL CHECK (form IN ('Cair', 'Padat')),
    current_stock       NUMERIC NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    unit                TEXT NOT NULL CHECK (unit IN ('mL', 'L', 'g', 'kg')),
    min_stock_threshold NUMERIC NOT NULL DEFAULT 0 CHECK (min_stock_threshold >= 0),
    location            TEXT,
    barcode_id          TEXT UNIQUE,
    expiry_date         DATE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.reagents IS 'Data master inventaris reagen kimia laboratorium';
COMMENT ON COLUMN public.reagents.form IS 'Bentuk fisik: Cair atau Padat';
COMMENT ON COLUMN public.reagents.unit IS 'Satuan: mL/L untuk Cair, g/kg untuk Padat';
COMMENT ON COLUMN public.reagents.min_stock_threshold IS 'Batas minimum stok sebelum muncul peringatan';
COMMENT ON COLUMN public.reagents.barcode_id IS 'ID barcode unik untuk scan (opsional)';

-- ============================================================
-- TABEL: usage_logs
-- Audit trail otomatis setiap perubahan stok
-- (diisi oleh trigger, BUKAN oleh aplikasi secara manual)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reagent_id    UUID NOT NULL REFERENCES public.reagents(id) ON DELETE CASCADE,
    old_stock     NUMERIC NOT NULL,
    new_stock     NUMERIC NOT NULL,
    change_amount NUMERIC NOT NULL, -- positif = penambahan, negatif = pemakaian
    action        TEXT NOT NULL CHECK (action IN ('Penambahan', 'Pemakaian', 'Koreksi')),
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.usage_logs IS 'Audit trail otomatis setiap perubahan stok reagen';
COMMENT ON COLUMN public.usage_logs.change_amount IS 'Positif = penambahan stok, Negatif = pemakaian stok';
COMMENT ON COLUMN public.usage_logs.action IS 'Penambahan | Pemakaian | Koreksi';

-- ============================================================
-- INDEX untuk performa query
-- ============================================================

-- Index barcode untuk pencarian cepat saat scan
CREATE INDEX IF NOT EXISTS idx_reagents_barcode_id
    ON public.reagents(barcode_id);

-- Index untuk filter expired
CREATE INDEX IF NOT EXISTS idx_reagents_expiry_date
    ON public.reagents(expiry_date);

-- Index untuk filter berdasarkan bentuk (Cair/Padat)
CREATE INDEX IF NOT EXISTS idx_reagents_form
    ON public.reagents(form);

-- Index untuk query log berdasarkan reagen
CREATE INDEX IF NOT EXISTS idx_usage_logs_reagent_id
    ON public.usage_logs(reagent_id);

-- Index untuk sort log by waktu
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at
    ON public.usage_logs(created_at DESC);

-- ============================================================
-- VERIFIKASI
-- Jalankan query ini untuk memastikan tabel berhasil dibuat:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public';
-- ============================================================

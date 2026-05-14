-- ============================================================
-- FASE 1 - TASK 1.3: VIEWS & HELPER QUERIES
-- Jalankan SETELAH 01_tables.sql dan 02_triggers.sql
-- ============================================================

-- ============================================================
-- VIEW 1: usage_logs_with_reagent
-- Menggabungkan log dengan nama dan satuan reagen
-- Digunakan di halaman Riwayat agar bisa tampilkan nama reagen
-- ============================================================
DROP VIEW IF EXISTS public.usage_logs_with_reagent;

CREATE VIEW public.usage_logs_with_reagent AS
SELECT
    ul.id,
    ul.reagent_id,
    ul.old_stock,
    ul.new_stock,
    ul.change_amount,
    ul.action,
    ul.notes,
    ul.created_at,
    r.name          AS reagent_name,
    r.unit          AS reagent_unit,
    r.form          AS reagent_form,
    r.location      AS reagent_location
FROM public.usage_logs ul
JOIN public.reagents r ON r.id = ul.reagent_id
ORDER BY ul.created_at DESC;

COMMENT ON VIEW public.usage_logs_with_reagent IS
    'Usage logs yang digabungkan dengan nama dan info reagen';

-- ============================================================
-- VIEW 2: expired_reagents
-- Reagen yang tanggal kedaluwarsanya sudah lewat
-- Digunakan di filter "Expired" di halaman Daftar
-- ============================================================
DROP VIEW IF EXISTS public.expired_reagents;

CREATE VIEW public.expired_reagents AS
SELECT *
FROM public.reagents
WHERE expiry_date IS NOT NULL
  AND expiry_date < CURRENT_DATE
ORDER BY expiry_date ASC;

COMMENT ON VIEW public.expired_reagents IS
    'Reagen yang sudah melewati tanggal kedaluwarsa';

-- ============================================================
-- VIEW 3: low_stock_reagents
-- Reagen dengan stok di bawah threshold minimum
-- Digunakan di filter "Stok Rendah" di halaman Daftar
-- ============================================================
DROP VIEW IF EXISTS public.low_stock_reagents;

CREATE VIEW public.low_stock_reagents AS
SELECT *
FROM public.reagents
WHERE current_stock < min_stock_threshold
  AND min_stock_threshold > 0
ORDER BY (current_stock / NULLIF(min_stock_threshold, 0)) ASC; -- urut dari paling kritis

COMMENT ON VIEW public.low_stock_reagents IS
    'Reagen dengan stok di bawah ambang batas minimum';

-- ============================================================
-- VIEW 4: dashboard_summary
-- Ringkasan untuk kartu dashboard utama
-- Mengembalikan 1 baris berisi semua angka ringkasan
-- ============================================================
DROP VIEW IF EXISTS public.dashboard_summary;

CREATE VIEW public.dashboard_summary AS
SELECT
    -- Total semua reagen
    COUNT(*)::INTEGER                                       AS total_reagents,

    -- Reagen dengan stok rendah (stok < threshold, threshold > 0)
    COUNT(*) FILTER (
        WHERE current_stock < min_stock_threshold
          AND min_stock_threshold > 0
    )::INTEGER                                              AS low_stock_count,

    -- Reagen yang stoknya habis (= 0)
    COUNT(*) FILTER (
        WHERE current_stock = 0
    )::INTEGER                                              AS empty_stock_count,

    -- Reagen yang sudah expired
    COUNT(*) FILTER (
        WHERE expiry_date IS NOT NULL
          AND expiry_date < CURRENT_DATE
    )::INTEGER                                              AS expired_count,

    -- Reagen yang akan expired dalam 30 hari ke depan
    COUNT(*) FILTER (
        WHERE expiry_date IS NOT NULL
          AND expiry_date >= CURRENT_DATE
          AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
    )::INTEGER                                              AS expiring_soon_count,

    -- Total reagen bentuk Cair
    COUNT(*) FILTER (WHERE form = 'Cair')::INTEGER         AS liquid_count,

    -- Total reagen bentuk Padat
    COUNT(*) FILTER (WHERE form = 'Padat')::INTEGER        AS solid_count

FROM public.reagents;

COMMENT ON VIEW public.dashboard_summary IS
    'Ringkasan statistik inventaris untuk tampilan dashboard';

-- ============================================================
-- VERIFIKASI: test views setelah seed data
-- SELECT * FROM public.dashboard_summary;
-- SELECT * FROM public.expired_reagents;
-- SELECT * FROM public.low_stock_reagents;
-- SELECT * FROM public.usage_logs_with_reagent LIMIT 10;
-- ============================================================

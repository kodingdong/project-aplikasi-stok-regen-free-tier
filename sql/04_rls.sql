-- ============================================================
-- FASE 1 - TASK 1.4: ROW LEVEL SECURITY (RLS)
-- Jalankan SETELAH 01_tables.sql
-- ============================================================
-- Untuk aplikasi personal:
--   - RLS diaktifkan agar aman secara default
--   - Policy "allow all" dibuat agar anon key bisa akses
--   - Jika nanti ingin tambah auth, tinggal ubah policy ini
-- ============================================================

-- ============================================================
-- TABEL: reagents
-- ============================================================
ALTER TABLE public.reagents ENABLE ROW LEVEL SECURITY;

-- Izinkan SELECT untuk semua (anon & authenticated)
DROP POLICY IF EXISTS "reagents_select_policy" ON public.reagents;
CREATE POLICY "reagents_select_policy"
    ON public.reagents FOR SELECT
    USING (true);

-- Izinkan INSERT untuk semua
DROP POLICY IF EXISTS "reagents_insert_policy" ON public.reagents;
CREATE POLICY "reagents_insert_policy"
    ON public.reagents FOR INSERT
    WITH CHECK (true);

-- Izinkan UPDATE untuk semua
DROP POLICY IF EXISTS "reagents_update_policy" ON public.reagents;
CREATE POLICY "reagents_update_policy"
    ON public.reagents FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Izinkan DELETE untuk semua
DROP POLICY IF EXISTS "reagents_delete_policy" ON public.reagents;
CREATE POLICY "reagents_delete_policy"
    ON public.reagents FOR DELETE
    USING (true);

-- ============================================================
-- TABEL: usage_logs
-- ============================================================
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Izinkan SELECT untuk semua (untuk lihat riwayat)
DROP POLICY IF EXISTS "usage_logs_select_policy" ON public.usage_logs;
CREATE POLICY "usage_logs_select_policy"
    ON public.usage_logs FOR SELECT
    USING (true);

-- Izinkan INSERT (trigger menggunakan SECURITY DEFINER, tapi jaga-jaga)
DROP POLICY IF EXISTS "usage_logs_insert_policy" ON public.usage_logs;
CREATE POLICY "usage_logs_insert_policy"
    ON public.usage_logs FOR INSERT
    WITH CHECK (true);

-- ============================================================
-- CATATAN KEAMANAN:
-- Policy USING (true) = semua orang dengan anon key bisa akses.
-- Ini OK untuk aplikasi personal. Jika suatu saat ingin
-- membatasi akses hanya untuk user yang login, ubah menjadi:
--   USING (auth.uid() IS NOT NULL)
-- ============================================================

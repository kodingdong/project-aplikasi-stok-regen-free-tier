-- ============================================================
-- FASE 1 - TASK 1.2: TRIGGER AUDIT TRAIL
-- Jalankan SETELAH 01_tables.sql berhasil
-- ============================================================
-- Trigger ini akan OTOMATIS mencatat ke usage_logs
-- setiap kali current_stock di tabel reagents berubah.
-- Anda TIDAK perlu menulis kode JS untuk ini!
-- ============================================================

-- ============================================================
-- FUNCTION: log_stock_change()
-- Dipanggil oleh trigger setiap kali ada UPDATE pada reagents
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_stock_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Hanya catat jika current_stock benar-benar berubah
    IF OLD.current_stock IS DISTINCT FROM NEW.current_stock THEN
        INSERT INTO public.usage_logs (
            reagent_id,
            old_stock,
            new_stock,
            change_amount,
            action,
            notes
        ) VALUES (
            NEW.id,
            OLD.current_stock,
            NEW.current_stock,
            NEW.current_stock - OLD.current_stock,
            -- Tentukan jenis aksi berdasarkan perubahan stok
            CASE
                WHEN NEW.current_stock > OLD.current_stock THEN 'Penambahan'
                WHEN NEW.current_stock < OLD.current_stock THEN 'Pemakaian'
                ELSE 'Koreksi'
            END,
            NEW.notes -- Ambil notes dari update (bisa diisi dari aplikasi)
        );
    END IF;

    -- Selalu update timestamp updated_at saat ada perubahan apapun
    NEW.updated_at = now();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_stock_change() IS
    'Trigger function: otomatis catat perubahan stok ke usage_logs dan update updated_at';

-- ============================================================
-- TRIGGER: trg_log_stock_change
-- Aktif SEBELUM setiap UPDATE pada tabel reagents
-- ============================================================
DROP TRIGGER IF EXISTS trg_log_stock_change ON public.reagents;

CREATE TRIGGER trg_log_stock_change
    BEFORE UPDATE ON public.reagents
    FOR EACH ROW
    EXECUTE FUNCTION public.log_stock_change();

COMMENT ON TRIGGER trg_log_stock_change ON public.reagents IS
    'Trigger audit trail: mencatat perubahan current_stock ke tabel usage_logs';

-- ============================================================
-- TEST TRIGGER (jalankan setelah ada data dari seed):
--
-- UPDATE public.reagents
-- SET current_stock = 2000
-- WHERE barcode_id = 'RGN-001';
--
-- SELECT * FROM public.usage_logs ORDER BY created_at DESC LIMIT 5;
-- Harusnya muncul 1 row baru dengan action = 'Pemakaian' atau 'Penambahan'
-- ============================================================

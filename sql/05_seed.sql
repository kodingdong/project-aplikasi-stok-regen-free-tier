-- ============================================================
-- FASE 1 - TASK 1.5: SEED DATA (SAMPLE REAGEN)
-- Jalankan TERAKHIR setelah semua file SQL lain berhasil
-- ============================================================
-- Berisi 10 contoh reagen kimia (campuran Cair & Padat)
-- untuk keperluan testing dan demonstrasi aplikasi.
-- ============================================================

-- Hapus data lama jika ada (untuk re-run yang bersih)
DELETE FROM public.usage_logs;
DELETE FROM public.reagents;

-- ============================================================
-- INSERT: Reagen Cair
-- ============================================================
INSERT INTO public.reagents (
    name, form, current_stock, unit, min_stock_threshold,
    location, barcode_id, expiry_date, notes
) VALUES
(
    'HCl 37% (Asam Klorida)',
    'Cair', 2500, 'mL', 500,
    'Rak A-1 (Lemari Asam)',
    'RGN-001',
    '2027-06-15',
    'Asam kuat. Simpan di lemari asam. Gunakan APD lengkap.'
),
(
    'H2SO4 98% (Asam Sulfat)',
    'Cair', 1800, 'mL', 500,
    'Rak A-2 (Lemari Asam)',
    'RGN-002',
    '2027-12-31',
    'Asam kuat korosif. Jauhkan dari air.'
),
(
    'Etanol 96%',
    'Cair', 5000, 'mL', 1000,
    'Rak B-1',
    'RGN-003',
    '2028-03-20',
    'Mudah terbakar. Jauhkan dari api.'
),
(
    'Akuades (Distilled Water)',
    'Cair', 10000, 'mL', 2000,
    'Rak B-3',
    'RGN-004',
    '2026-12-31',
    'Gunakan untuk pengencer dan pencucian alat.'
),
(
    'HNO3 65% (Asam Nitrat)',
    'Cair', 300, 'mL', 500,
    'Rak A-3 (Lemari Asam)',
    'RGN-005',
    '2024-08-10',  -- sudah expired
    'STOK RENDAH & EXPIRED. Segera pesan ulang.'
),
(
    'Metanol 99%',
    'Cair', 0, 'mL', 500,
    'Rak B-2',
    'RGN-006',
    '2027-09-30',
    'STOK HABIS. Segera restock.'
);

-- ============================================================
-- INSERT: Reagen Padat
-- ============================================================
INSERT INTO public.reagents (
    name, form, current_stock, unit, min_stock_threshold,
    location, barcode_id, expiry_date, notes
) VALUES
(
    'NaOH Pellet (Natrium Hidroksida)',
    'Padat', 450, 'g', 200,
    'Rak C-1',
    'RGN-007',
    '2028-01-20',
    'Basa kuat higroskopis. Simpan rapat.'
),
(
    'KMnO4 (Kalium Permanganat)',
    'Padat', 80, 'g', 100,
    'Rak C-2',
    'RGN-008',
    '2026-05-01',  -- sudah expired
    'Oksidator kuat. STOK RENDAH & EXPIRED.'
),
(
    'NaCl (Natrium Klorida)',
    'Padat', 2000, 'g', 500,
    'Rak C-3',
    'RGN-009',
    '2029-06-30',
    'Garam biasa untuk larutan buffer dan media.'
),
(
    'CuSO4 (Tembaga Sulfat)',
    'Padat', 350, 'g', 100,
    'Rak D-1',
    'RGN-010',
    '2028-11-15',
    'Warna biru. Gunakan untuk uji Fehling.'
);

-- ============================================================
-- VERIFIKASI: Cek hasil insert
-- SELECT name, form, current_stock, unit, expiry_date FROM public.reagents ORDER BY name;
-- SELECT * FROM public.dashboard_summary;
-- ============================================================

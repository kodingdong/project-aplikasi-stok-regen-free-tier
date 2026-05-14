// ============================================================
// js/log-service.js
// Query operations untuk tabel usage_logs
// ============================================================
// Catatan: TIDAK ada fungsi createLog() di sini.
// Log dibuat OTOMATIS oleh trigger PostgreSQL saat
// current_stock di tabel reagents berubah.
// ============================================================

const LogService = (() => {
    'use strict';

    function getClient() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client belum diinisialisasi.');
        }
        return window.supabaseClient;
    }

    // --------------------------------------------------------
    // READ: Ambil semua log, diurutkan dari terbaru
    // Menggunakan view usage_logs_with_reagent agar nama reagen ikut tampil
    // limit: jumlah maksimal log yang diambil (default 100)
    // --------------------------------------------------------
    async function getAllLogs(limit = 100) {
        const { data, error } = await getClient()
            .from('usage_logs_with_reagent')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    }

    // --------------------------------------------------------
    // READ: Ambil log untuk satu reagen tertentu
    // --------------------------------------------------------
    async function getLogsByReagent(reagentId, limit = 50) {
        const { data, error } = await getClient()
            .from('usage_logs_with_reagent')
            .select('*')
            .eq('reagent_id', reagentId)
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    }

    // --------------------------------------------------------
    // READ: Ambil log raw (tanpa join) jika diperlukan
    // --------------------------------------------------------
    async function getRawLogs(limit = 100) {
        const { data, error } = await getClient()
            .from('usage_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);
        return { data, error };
    }

    return {
        getAllLogs,
        getLogsByReagent,
        getRawLogs,
    };
})();

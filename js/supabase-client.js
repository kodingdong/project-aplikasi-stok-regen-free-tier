// ============================================================
// js/supabase-client.js
// Inisialisasi Supabase client - dimuat setelah config.js
// ============================================================

(function () {
    'use strict';

    // Pastikan library Supabase sudah dimuat dari CDN
    if (typeof supabase === 'undefined') {
        console.error('[supabase-client] Library Supabase belum dimuat. Pastikan CDN script ada di index.html');
        return;
    }

    // Pastikan config sudah dimuat
    if (typeof SUPABASE_URL === 'undefined' || typeof SUPABASE_ANON_KEY === 'undefined') {
        console.error('[supabase-client] config.js belum dimuat atau SUPABASE_URL/SUPABASE_ANON_KEY belum diisi');
        return;
    }

    // Buat client dan expose ke window agar bisa diakses dari file JS lain
    try {
        window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('[supabase-client] ✅ Supabase client berhasil diinisialisasi');
    } catch (error) {
        console.error('[supabase-client] ❌ Gagal inisialisasi:', error.message);
    }
})();

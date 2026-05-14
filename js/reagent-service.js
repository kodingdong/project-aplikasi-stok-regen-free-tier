// ============================================================
// js/reagent-service.js
// CRUD operations untuk tabel reagents
// ============================================================
// Semua fungsi mengembalikan { data, error }
// Selalu cek error sebelum menggunakan data!
// ============================================================

const ReagentService = (() => {
    'use strict';

    function getClient() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client belum diinisialisasi. Cek config.js');
        }
        return window.supabaseClient;
    }

    // --------------------------------------------------------
    // READ: Ambil semua reagen, diurutkan berdasarkan nama
    // --------------------------------------------------------
    async function getAllReagents() {
        const { data, error } = await getClient()
            .from('reagents')
            .select('*')
            .order('name', { ascending: true });
        return { data, error };
    }

    // --------------------------------------------------------
    // READ: Ambil satu reagen berdasarkan UUID
    // --------------------------------------------------------
    async function getReagentById(id) {
        const { data, error } = await getClient()
            .from('reagents')
            .select('*')
            .eq('id', id)
            .single();
        return { data, error };
    }

    // --------------------------------------------------------
    // READ: Cari reagen berdasarkan barcode_id (untuk scan)
    // --------------------------------------------------------
    async function searchByBarcode(barcode) {
        const { data, error } = await getClient()
            .from('reagents')
            .select('*')
            .eq('barcode_id', barcode.trim())
            .maybeSingle(); // maybeSingle: tidak error jika tidak ditemukan
        return { data, error };
    }

    // --------------------------------------------------------
    // READ: Cari reagen berdasarkan nama (partial match)
    // --------------------------------------------------------
    async function searchByName(keyword) {
        const { data, error } = await getClient()
            .from('reagents')
            .select('*')
            .ilike('name', `%${keyword}%`)
            .order('name', { ascending: true });
        return { data, error };
    }

    // --------------------------------------------------------
    // CREATE: Tambah reagen baru
    // --------------------------------------------------------
    async function createReagent(reagentData) {
        const { data, error } = await getClient()
            .from('reagents')
            .insert([reagentData])
            .select()
            .single();
        return { data, error };
    }

    // --------------------------------------------------------
    // UPDATE: Update data lengkap reagen (nama, lokasi, dll)
    // --------------------------------------------------------
    async function updateReagent(id, updatedData) {
        // Jangan sertakan field yang tidak perlu diupdate
        const { data, error } = await getClient()
            .from('reagents')
            .update(updatedData)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    }

    // --------------------------------------------------------
    // UPDATE: Update HANYA stok (trigger akan catat log otomatis)
    // notes: catatan penggunaan yang akan dicatat di usage_logs
    // --------------------------------------------------------
    async function updateStock(id, newStock, notes = null) {
        const updatePayload = { current_stock: newStock };
        if (notes) {
            updatePayload.notes = notes; // trigger akan baca notes ini
        }
        const { data, error } = await getClient()
            .from('reagents')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();
        return { data, error };
    }

    // --------------------------------------------------------
    // DELETE: Hapus reagen (usage_logs terkait ikut terhapus via CASCADE)
    // --------------------------------------------------------
    async function deleteReagent(id) {
        const { error } = await getClient()
            .from('reagents')
            .delete()
            .eq('id', id);
        return { error };
    }

    // --------------------------------------------------------
    // READ: Ambil reagen yang sudah expired (dari view)
    // --------------------------------------------------------
    async function getExpiredReagents() {
        const { data, error } = await getClient()
            .from('expired_reagents')
            .select('*');
        return { data, error };
    }

    // --------------------------------------------------------
    // READ: Ambil reagen dengan stok rendah (dari view)
    // --------------------------------------------------------
    async function getLowStockReagents() {
        const { data, error } = await getClient()
            .from('low_stock_reagents')
            .select('*');
        return { data, error };
    }

    // --------------------------------------------------------
    // READ: Ambil ringkasan untuk dashboard (dari view)
    // --------------------------------------------------------
    async function getDashboardSummary() {
        // Views kadang tidak compatible dengan .single(), gunakan select biasa
        // lalu ambil elemen pertama
        const { data, error } = await getClient()
            .from('dashboard_summary')
            .select('*');
        // Kembalikan objek pertama (bukan array)
        return { data: Array.isArray(data) ? data[0] : data, error };
    }

    // --------------------------------------------------------
    // READ: Filter reagen berdasarkan bentuk (Cair/Padat)
    // --------------------------------------------------------
    async function getReagentsByForm(form) {
        const { data, error } = await getClient()
            .from('reagents')
            .select('*')
            .eq('form', form)
            .order('name', { ascending: true });
        return { data, error };
    }

    // Expose fungsi ke luar
    return {
        getAllReagents,
        getReagentById,
        searchByBarcode,
        searchByName,
        createReagent,
        updateReagent,
        updateStock,
        deleteReagent,
        getExpiredReagents,
        getLowStockReagents,
        getDashboardSummary,
        getReagentsByForm,
    };
})();

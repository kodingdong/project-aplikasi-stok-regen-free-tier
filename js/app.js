// ============================================================
// js/app.js
// Entry point: event listeners, navigasi, dan orchestrasi
// ============================================================

const App = (() => {
    'use strict';

    // State lokal
    let allReagents = [];
    let currentFilter = 'semua';
    let searchQuery = '';
    let editingReagentId = null;

    // --------------------------------------------------------
    // INIT: Jalankan saat halaman pertama kali dimuat
    // --------------------------------------------------------
    async function init() {
        console.log('[App] Inisialisasi dimulai...');
        try {
            setupNavigation();
            setupModalClose();
            setupSearchBar();
            setupFilterChips();
            setupFormListeners();
            console.log('[App] Listeners berhasil dipasang.');
        } catch (e) {
            console.error('[App] Gagal memasang listeners:', e);
        }

        // Jalankan data loading secara paralel agar tidak saling blokir
        console.log('[App] Memulai pemuatan data...');
        Promise.all([
            loadDashboard(),
            loadReagents()
        ]).then(() => {
            console.log('[App] Inisialisasi selesai sepenuhnya.');
        }).catch(err => {
            console.error('[App] Terjadi kesalahan saat muat data awal:', err);
        });
    }

    // --------------------------------------------------------
    // NAVIGASI: Switch antar section (Dashboard / Daftar / Riwayat)
    // --------------------------------------------------------
    function setupNavigation() {
        const navBtns = document.querySelectorAll('[data-nav]');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.dataset.nav;
                switchSection(target);
            });
        });
    }

    function switchSection(sectionName) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('[data-nav]').forEach(b => b.classList.remove('active'));

        const section = document.getElementById(`section-${sectionName}`);
        const navBtn = document.querySelector(`[data-nav="${sectionName}"]`);
        if (section) section.classList.add('active');
        if (navBtn) navBtn.classList.add('active');

        // Lazy load: muat data saat pertama kali pindah ke tab Riwayat
        if (sectionName === 'riwayat') loadLogs();
    }

    // --------------------------------------------------------
    // DASHBOARD
    // --------------------------------------------------------
    async function loadDashboard() {
        console.log('[App] Memuat dashboard...');
        const { data, error } = await ReagentService.getDashboardSummary();
        if (error) {
            console.error('[App] Gagal load dashboard:', error.message, error);
            UIHelpers.renderDashboard({
                total_reagents: '?', low_stock_count: '?',
                empty_stock_count: '?', expired_count: '?',
                expiring_soon_count: '?', liquid_count: '?', solid_count: '?'
            });
            return;
        }
        if (!data) {
            console.warn('[App] Dashboard summary kosong (data null/undefined).');
            UIHelpers.renderDashboard({ total_reagents: 0, low_stock_count: 0,
                empty_stock_count: 0, expired_count: 0, expiring_soon_count: 0,
                liquid_count: 0, solid_count: 0 });
            return;
        }
        console.log('[App] Dashboard data diterima:', data);
        UIHelpers.renderDashboard(data);
    }

    // --------------------------------------------------------
    // DAFTAR REAGEN
    // --------------------------------------------------------
    async function loadReagents() {
        console.log('[App] Memuat daftar reagen...');
        UIHelpers.setLoading('reagent-list', true);
        const { data, error } = await ReagentService.getAllReagents();
        if (error) {
            console.error('[App] Gagal memuat data reagen:', error.message, error);
            document.getElementById('reagent-list').innerHTML =
                '<div class="error-state">❌ Gagal memuat data. Cek koneksi internet atau konfigurasi Supabase.</div>';
            return;
        }
        allReagents = data || [];
        applyFilterAndSearch();
    }

    function applyFilterAndSearch() {
        let filtered = [...allReagents];

        // Filter berdasarkan chip aktif
        if (currentFilter === 'cair') {
            filtered = filtered.filter(r => r.form === 'Cair');
        } else if (currentFilter === 'padat') {
            filtered = filtered.filter(r => r.form === 'Padat');
        } else if (currentFilter === 'rendah') {
            filtered = filtered.filter(r =>
                r.min_stock_threshold > 0 && r.current_stock < r.min_stock_threshold
            );
        } else if (currentFilter === 'expired') {
            filtered = filtered.filter(r => UIHelpers.isExpired(r.expiry_date));
        }

        // Filter berdasarkan search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(r =>
                r.name.toLowerCase().includes(q) ||
                (r.barcode_id && r.barcode_id.toLowerCase().includes(q)) ||
                (r.location && r.location.toLowerCase().includes(q))
            );
        }

        UIHelpers.renderReagentList(filtered);
        document.getElementById('reagent-count').textContent =
            `Menampilkan ${filtered.length} dari ${allReagents.length} reagen`;
    }

    // --------------------------------------------------------
    // SEARCH BAR
    // --------------------------------------------------------
    function setupSearchBar() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;

        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                searchQuery = e.target.value;
                applyFilterAndSearch();
            }, 300);
        });

        const clearBtn = document.getElementById('search-clear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                searchQuery = '';
                applyFilterAndSearch();
            });
        }
    }

    // --------------------------------------------------------
    // FILTER CHIPS
    // --------------------------------------------------------
    function setupFilterChips() {
        const chips = document.querySelectorAll('[data-filter]');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                currentFilter = chip.dataset.filter;
                applyFilterAndSearch();
            });
        });
    }

    // --------------------------------------------------------
    // MODAL PAKAI / TAMBAH STOK
    // --------------------------------------------------------
    function openStockModal(reagentId, mode) {
        const reagent = allReagents.find(r => r.id === reagentId);
        if (!reagent) return;

        const isUse = mode === 'pakai';
        const title = isUse ? `🔻 Pakai Stok: ${reagent.name}` : `🔺 Tambah Stok: ${reagent.name}`;
        const actionLabel = isUse ? 'Kurangi Stok' : 'Tambah Stok';

        const body = `
            <div class="form-info-row">
                <span>Stok Saat Ini:</span>
                <strong>${UIHelpers.formatNumber(reagent.current_stock)} ${reagent.unit}</strong>
            </div>
            <div class="form-group">
                <label for="stock-amount">Jumlah (${reagent.unit})</label>
                <input type="number" id="stock-amount" min="0.01" step="any"
                    placeholder="Masukkan jumlah..." required>
            </div>
            <div class="form-group">
                <label for="stock-notes">Catatan (opsional)</label>
                <input type="text" id="stock-notes"
                    placeholder="Contoh: Dipakai untuk praktikum A">
            </div>`;

        const footer = `
            <button class="btn btn-secondary" onclick="UIHelpers.hideModal()">Batal</button>
            <button class="btn ${isUse ? 'btn-danger' : 'btn-success'}" id="btn-confirm-stock">
                ${actionLabel}
            </button>`;

        UIHelpers.showModal(title, body, footer);

        document.getElementById('btn-confirm-stock').addEventListener('click', async () => {
            await handleStockChange(reagentId, reagent, mode);
        });

        // Enter key submit
        document.getElementById('stock-amount').addEventListener('keydown', e => {
            if (e.key === 'Enter') document.getElementById('btn-confirm-stock').click();
        });
    }

    async function handleStockChange(reagentId, reagent, mode) {
        const amountInput = document.getElementById('stock-amount');
        const notesInput = document.getElementById('stock-notes');
        const confirmBtn = document.getElementById('btn-confirm-stock');

        const amount = parseFloat(amountInput.value);
        if (isNaN(amount) || amount <= 0) {
            UIHelpers.showToast('Masukkan jumlah yang valid (> 0)', 'warning');
            amountInput.focus();
            return;
        }

        const newStock = mode === 'pakai'
            ? reagent.current_stock - amount
            : reagent.current_stock + amount;

        if (newStock < 0) {
            UIHelpers.showToast(`Stok tidak cukup! Stok tersedia: ${UIHelpers.formatNumber(reagent.current_stock)} ${reagent.unit}`, 'warning');
            return;
        }

        UIHelpers.setButtonLoading(confirmBtn, true);
        const { error } = await ReagentService.updateStock(reagentId, newStock, notesInput.value || null);
        UIHelpers.setButtonLoading(confirmBtn, false);

        if (error) {
            UIHelpers.showToast('Gagal update stok: ' + error.message, 'error');
            return;
        }

        UIHelpers.hideModal();
        const actionMsg = mode === 'pakai' ? 'dikurangi' : 'ditambah';
        UIHelpers.showToast(`Stok berhasil ${actionMsg}. Log tercatat otomatis.`, 'success');
        await loadReagents();
        await loadDashboard();
    }

    // --------------------------------------------------------
    // MODAL TAMBAH / EDIT REAGEN
    // --------------------------------------------------------
    function openAddModal() {
        editingReagentId = null;
        showReagentFormModal(null);
    }

    async function openEditModal(reagentId) {
        const reagent = allReagents.find(r => r.id === reagentId);
        if (!reagent) return;
        editingReagentId = reagentId;
        showReagentFormModal(reagent);
    }

    function showReagentFormModal(reagent) {
        const isEdit = !!reagent;
        const title = isEdit ? `✏️ Edit Reagen` : '➕ Tambah Reagen Baru';

        const body = `
            <form id="reagent-form" autocomplete="off">
                <div class="form-group">
                    <label for="f-name">Nama Reagen *</label>
                    <input type="text" id="f-name" required maxlength="200"
                        value="${UIHelpers.escapeHtml(reagent?.name || '')}"
                        placeholder="Contoh: HCl 37%">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="f-form">Bentuk *</label>
                        <select id="f-form" required>
                            <option value="Cair" ${reagent?.form === 'Cair' ? 'selected' : ''}>💧 Cair</option>
                            <option value="Padat" ${reagent?.form === 'Padat' ? 'selected' : ''}>⚗️ Padat</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="f-unit">Satuan *</label>
                        <select id="f-unit" required>
                            <option value="mL" ${reagent?.unit === 'mL' ? 'selected' : ''}>mL</option>
                            <option value="L" ${reagent?.unit === 'L' ? 'selected' : ''}>L</option>
                            <option value="g" ${reagent?.unit === 'g' ? 'selected' : ''}>g</option>
                            <option value="kg" ${reagent?.unit === 'kg' ? 'selected' : ''}>kg</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="f-stock">Stok Awal *</label>
                        <input type="number" id="f-stock" min="0" step="any" required
                            value="${reagent?.current_stock ?? ''}"
                            placeholder="0">
                    </div>
                    <div class="form-group">
                        <label for="f-threshold">Min. Stok</label>
                        <input type="number" id="f-threshold" min="0" step="any"
                            value="${reagent?.min_stock_threshold ?? ''}"
                            placeholder="0">
                    </div>
                </div>
                <div class="form-group">
                    <label for="f-location">Lokasi Penyimpanan</label>
                    <input type="text" id="f-location" maxlength="100"
                        value="${UIHelpers.escapeHtml(reagent?.location || '')}"
                        placeholder="Contoh: Rak A-1">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="f-barcode">Barcode ID</label>
                        <div class="barcode-input-group">
                            <input type="text" id="f-barcode" maxlength="50"
                                value="${UIHelpers.escapeHtml(reagent?.barcode_id || '')}"
                                placeholder="Contoh: RGN-001">
                            <button type="button" class="btn btn-sm btn-outline" id="btn-scan-form" title="Scan via kamera">
                                📷
                            </button>
                            <button type="button" class="btn btn-sm btn-outline" id="btn-generate-barcode" title="Generate otomatis">
                                🔄 Auto
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="f-expiry">Tanggal Kedaluwarsa</label>
                        <input type="date" id="f-expiry"
                            value="${reagent?.expiry_date || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="f-notes">Catatan</label>
                    <textarea id="f-notes" rows="2" maxlength="500"
                        placeholder="Informasi tambahan tentang reagen ini...">${UIHelpers.escapeHtml(reagent?.notes || '')}</textarea>
                </div>
            </form>`;

        const footer = `
            <button class="btn btn-secondary" onclick="UIHelpers.hideModal()">Batal</button>
            <button class="btn btn-primary" id="btn-save-reagent">
                ${isEdit ? '💾 Simpan Perubahan' : '➕ Tambah Reagen'}
            </button>`;

        UIHelpers.showModal(title, body, footer);

        // Auto-update satuan saat bentuk berubah
        document.getElementById('f-form').addEventListener('change', function () {
            const unitSelect = document.getElementById('f-unit');
            if (this.value === 'Cair') {
                unitSelect.innerHTML = '<option value="mL">mL</option><option value="L">L</option>';
            } else {
                unitSelect.innerHTML = '<option value="g">g</option><option value="kg">kg</option>';
            }
        });

        document.getElementById('btn-save-reagent').addEventListener('click', handleSaveReagent);

        // Tombol Scan Barcode di dalam form
        const btnScanForm = document.getElementById('btn-scan-form');
        if (btnScanForm) {
            btnScanForm.addEventListener('click', () => {
                UIHelpers.hideModal();
                BarcodeModule.startScan((barcode) => {
                    // Setelah scan, buka kembali form dan isi barcode
                    showReagentFormModal(reagent);
                    setTimeout(() => {
                        const barcodeInput = document.getElementById('f-barcode');
                        if (barcodeInput) barcodeInput.value = barcode;
                    }, 200);
                });
            });
        }

        // Tombol Generate Barcode ID otomatis
        const btnGenerate = document.getElementById('btn-generate-barcode');
        if (btnGenerate) {
            btnGenerate.addEventListener('click', async () => {
                btnGenerate.textContent = '⏳';
                btnGenerate.disabled = true;
                const newId = await BarcodeModule.generateBarcodeId();
                document.getElementById('f-barcode').value = newId;
                btnGenerate.textContent = '🔄 Auto';
                btnGenerate.disabled = false;
                UIHelpers.showToast(`Barcode ID "${newId}" berhasil di-generate.`, 'info');
            });
        }
    }

    async function handleSaveReagent() {
        const btn = document.getElementById('btn-save-reagent');
        const name = document.getElementById('f-name').value.trim();
        const form = document.getElementById('f-form').value;
        const unit = document.getElementById('f-unit').value;
        const stock = parseFloat(document.getElementById('f-stock').value);
        const threshold = parseFloat(document.getElementById('f-threshold').value) || 0;
        const location = document.getElementById('f-location').value.trim();
        const barcodeId = document.getElementById('f-barcode').value.trim() || null;
        const expiryDate = document.getElementById('f-expiry').value || null;
        const notes = document.getElementById('f-notes').value.trim() || null;

        if (!name) { UIHelpers.showToast('Nama reagen wajib diisi.', 'warning'); return; }
        if (isNaN(stock) || stock < 0) { UIHelpers.showToast('Stok harus berupa angka >= 0.', 'warning'); return; }

        const payload = { name, form, unit, current_stock: stock, min_stock_threshold: threshold, location: location || null, barcode_id: barcodeId, expiry_date: expiryDate, notes };

        UIHelpers.setButtonLoading(btn, true);
        let result;
        if (editingReagentId) {
            result = await ReagentService.updateReagent(editingReagentId, payload);
        } else {
            result = await ReagentService.createReagent(payload);
        }
        UIHelpers.setButtonLoading(btn, false);

        if (result.error) {
            const msg = result.error.message.includes('unique') ? 'Barcode ID sudah digunakan reagen lain.' : result.error.message;
            UIHelpers.showToast('Gagal menyimpan: ' + msg, 'error');
            return;
        }

        UIHelpers.hideModal();
        UIHelpers.showToast(editingReagentId ? 'Reagen berhasil diperbarui.' : 'Reagen baru berhasil ditambahkan.', 'success');
        editingReagentId = null;
        await loadReagents();
        await loadDashboard();
    }

    // --------------------------------------------------------
    // HAPUS REAGEN
    // --------------------------------------------------------
    function confirmDelete(reagentId, reagentName) {
        const body = `<p>Yakin ingin menghapus reagen <strong>${UIHelpers.escapeHtml(reagentName)}</strong>?</p>
            <p class="text-muted">Semua riwayat penggunaan juga akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.</p>`;
        const footer = `
            <button class="btn btn-secondary" onclick="UIHelpers.hideModal()">Batal</button>
            <button class="btn btn-danger" id="btn-confirm-delete">🗑️ Ya, Hapus</button>`;

        UIHelpers.showModal('🗑️ Konfirmasi Hapus', body, footer);
        document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
            const btn = document.getElementById('btn-confirm-delete');
            UIHelpers.setButtonLoading(btn, true);
            const { error } = await ReagentService.deleteReagent(reagentId);
            if (error) {
                UIHelpers.showToast('Gagal menghapus: ' + error.message, 'error');
                UIHelpers.setButtonLoading(btn, false);
                return;
            }
            UIHelpers.hideModal();
            UIHelpers.showToast(`Reagen "${reagentName}" berhasil dihapus.`, 'success');
            await loadReagents();
            await loadDashboard();
        });
    }

    // --------------------------------------------------------
    // RIWAYAT LOG
    // --------------------------------------------------------
    async function loadLogs() {
        UIHelpers.setLoading('log-table-body', true);
        const { data, error } = await LogService.getAllLogs(APP_CONFIG.logsLimit);
        if (error) {
            UIHelpers.showToast('Gagal memuat riwayat: ' + error.message, 'error');
            return;
        }
        UIHelpers.renderLogTable(data || []);
    }

    // --------------------------------------------------------
    // FORM LISTENERS (tombol di luar modal)
    // --------------------------------------------------------
    function setupFormListeners() {
        const btnAdd = document.getElementById('btn-add-reagent');
        if (btnAdd) btnAdd.addEventListener('click', openAddModal);

        // Tombol Scan Barcode di toolbar (halaman Daftar)
        const btnScan = document.getElementById('btn-scan-barcode');
        if (btnScan) {
            // Sembunyikan jika kamera tidak didukung (desktop tanpa webcam)
            if (!BarcodeModule.isCameraSupported()) {
                btnScan.style.display = 'none';
            }
            btnScan.addEventListener('click', () => {
                BarcodeModule.startScan((barcode) => {
                    // Setelah scan, cari reagen yang cocok
                    searchQuery = barcode;
                    document.getElementById('search-input').value = barcode;
                    applyFilterAndSearch();
                });
            });
        }

        // Tombol Tutup Scanner
        const btnScannerClose = document.getElementById('scanner-close');
        if (btnScannerClose) {
            btnScannerClose.addEventListener('click', () => BarcodeModule.stopScan());
        }

        const btnExportReagents = document.getElementById('btn-export-reagents');
        if (btnExportReagents) btnExportReagents.addEventListener('click', () => {
            const exportData = allReagents.map(r => ({
                'Nama': r.name, 'Bentuk': r.form, 'Stok': r.current_stock,
                'Satuan': r.unit, 'Min Stok': r.min_stock_threshold,
                'Lokasi': r.location || '', 'Barcode': r.barcode_id || '',
                'Kedaluwarsa': r.expiry_date || '', 'Catatan': r.notes || '',
            }));
            UIHelpers.exportToCSV(exportData, `inventaris-reagen-${new Date().toISOString().slice(0,10)}.csv`);
        });

        const btnExportLogs = document.getElementById('btn-export-logs');
        if (btnExportLogs) btnExportLogs.addEventListener('click', async () => {
            const { data } = await LogService.getAllLogs(1000);
            if (!data) return;
            const exportData = data.map(l => ({
                'Tanggal': new Date(l.created_at).toLocaleString('id-ID'),
                'Reagen': l.reagent_name, 'Aksi': l.action,
                'Stok Lama': l.old_stock, 'Stok Baru': l.new_stock,
                'Perubahan': l.change_amount, 'Satuan': l.reagent_unit,
                'Catatan': l.notes || '',
            }));
            UIHelpers.exportToCSV(exportData, `riwayat-stok-${new Date().toISOString().slice(0,10)}.csv`);
        });
    }

    // --------------------------------------------------------
    // CLOSE MODAL via overlay click atau tombol X
    // --------------------------------------------------------
    function setupModalClose() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) UIHelpers.hideModal();
            });
        }
        const closeBtn = document.getElementById('modal-close');
        if (closeBtn) closeBtn.addEventListener('click', UIHelpers.hideModal);

        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') UIHelpers.hideModal();
        });
    }

    // Expose public API
    return { init, openStockModal, openEditModal, confirmDelete };
})();

// ============================================================
// START: Jalankan App saat DOM siap
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    // Cek apakah Supabase sudah terkonfigurasi
    if (typeof SUPABASE_URL === 'undefined' || SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
        document.getElementById('reagent-list').innerHTML = `
            <div class="setup-notice">
                <h2>⚙️ Setup Diperlukan</h2>
                <p>Buka file <code>js/config.js</code> dan isi <code>SUPABASE_URL</code> dan <code>SUPABASE_ANON_KEY</code> dengan nilai dari Supabase Dashboard Anda.</p>
                <p>Lihat <code>README.md</code> untuk panduan lengkap.</p>
            </div>`;
        return;
    }

    // Tunggu supabaseClient siap (CDN mungkin belum selesai load)
    let retries = 0;
    while (!window.supabaseClient && retries < 20) {
        await new Promise(r => setTimeout(r, 100));
        retries++;
    }

    if (!window.supabaseClient) {
        console.error('Supabase client gagal diinisialisasi setelah 2 detik.');
        UIHelpers.showToast('Gagal terhubung ke database. Cek koneksi internet.', 'error');
        return;
    }

    await App.init();
});

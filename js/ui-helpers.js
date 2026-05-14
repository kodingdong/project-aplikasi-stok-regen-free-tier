// ============================================================
// js/ui-helpers.js
// Fungsi-fungsi helper untuk render UI, modal, toast, dan CSV
// ============================================================

const UIHelpers = (() => {
    'use strict';

    // --------------------------------------------------------
    // UTIL: Cek apakah reagen sudah expired
    // --------------------------------------------------------
    function isExpired(expiryDate) {
        if (!expiryDate) return false;
        return new Date(expiryDate) < new Date(new Date().toDateString());
    }

    // --------------------------------------------------------
    // UTIL: Cek apakah reagen akan expired dalam N hari
    // --------------------------------------------------------
    function isExpiringSoon(expiryDate, days = 30) {
        if (!expiryDate) return false;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= days;
    }

    // --------------------------------------------------------
    // UTIL: Tentukan status stok dan warna indikator
    // Returns: { status, color, label }
    // --------------------------------------------------------
    function getStockStatus(reagent) {
        if (isExpired(reagent.expiry_date)) {
            return { status: 'expired', color: '#EF4444', label: 'EXPIRED', cssClass: 'status-expired' };
        }
        if (reagent.current_stock <= 0) {
            return { status: 'empty', color: '#EF4444', label: 'HABIS', cssClass: 'status-empty' };
        }
        if (reagent.min_stock_threshold > 0 && reagent.current_stock < reagent.min_stock_threshold) {
            return { status: 'low', color: '#F59E0B', label: 'RENDAH', cssClass: 'status-low' };
        }
        return { status: 'ok', color: '#22C55E', label: 'AMAN', cssClass: 'status-ok' };
    }

    // --------------------------------------------------------
    // UTIL: Format tanggal ke format Indonesia
    // --------------------------------------------------------
    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    }

    // --------------------------------------------------------
    // UTIL: Format angka dengan pemisah ribuan
    // --------------------------------------------------------
    function formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return parseFloat(num).toLocaleString('id-ID');
    }

    // --------------------------------------------------------
    // RENDER: Satu card reagen untuk daftar
    // --------------------------------------------------------
    function renderReagentCard(reagent) {
        const stockStatus = getStockStatus(reagent);
        const expired = isExpired(reagent.expiry_date);
        const expiringSoon = isExpiringSoon(reagent.expiry_date);
        const formIcon = reagent.form === 'Cair' ? '💧' : '⚗️';

        return `
        <div class="reagent-card ${stockStatus.cssClass}" data-id="${reagent.id}">
            <div class="card-header">
                <div class="card-title-row">
                    <span class="form-icon" title="${reagent.form}">${formIcon}</span>
                    <h3 class="reagent-name">${escapeHtml(reagent.name)}</h3>
                    <span class="status-badge ${stockStatus.cssClass}">${stockStatus.label}</span>
                </div>
            </div>
            <div class="card-body">
                <div class="stock-info">
                    <span class="stock-number">${formatNumber(reagent.current_stock)}</span>
                    <span class="stock-unit">${escapeHtml(reagent.unit)}</span>
                    ${reagent.min_stock_threshold > 0 ? `<span class="stock-threshold">/ min ${formatNumber(reagent.min_stock_threshold)} ${escapeHtml(reagent.unit)}</span>` : ''}
                </div>
                <div class="stock-bar-wrapper">
                    <div class="stock-bar" style="
                        width: ${reagent.min_stock_threshold > 0
                            ? Math.min(100, (reagent.current_stock / reagent.min_stock_threshold) * 50)
                            : (reagent.current_stock > 0 ? 100 : 0)}%;
                        background: ${stockStatus.color};
                    "></div>
                </div>
                <div class="card-meta">
                    ${reagent.location ? `<span class="meta-item">📍 ${escapeHtml(reagent.location)}</span>` : ''}
                    <span class="meta-item ${expired ? 'expired-text' : expiringSoon ? 'expiring-soon-text' : ''}">
                        📅 ${formatDate(reagent.expiry_date)}
                        ${expired ? ' ⚠️' : expiringSoon ? ' ⏰' : ''}
                    </span>
                    ${reagent.barcode_id ? `<span class="meta-item">🔖 ${escapeHtml(reagent.barcode_id)}</span>` : ''}
                </div>
            </div>
            <div class="card-actions">
                <button class="btn btn-sm btn-primary" onclick="App.openStockModal('${reagent.id}', 'pakai')">
                    🔻 Pakai
                </button>
                <button class="btn btn-sm btn-success" onclick="App.openStockModal('${reagent.id}', 'tambah')">
                    🔺 Tambah
                </button>
                <button class="btn btn-sm btn-secondary" onclick="App.openEditModal('${reagent.id}')">
                    ✏️ Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="App.confirmDelete('${reagent.id}', '${escapeHtml(reagent.name)}')">
                    🗑️
                </button>
            </div>
        </div>`;
    }

    // --------------------------------------------------------
    // RENDER: List semua reagen ke container
    // --------------------------------------------------------
    function renderReagentList(reagents, containerId = 'reagent-list') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!reagents || reagents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🧪</div>
                    <p>Belum ada reagen. Klik <strong>+ Tambah Reagen</strong> untuk memulai.</p>
                </div>`;
            return;
        }

        container.innerHTML = reagents.map(renderReagentCard).join('');
    }

    // --------------------------------------------------------
    // RENDER: Tabel riwayat penggunaan
    // --------------------------------------------------------
    function renderLogTable(logs, containerId = 'log-table-body') {
        const tbody = document.getElementById(containerId);
        if (!tbody) return;

        if (!logs || logs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">Belum ada riwayat perubahan stok.</td></tr>`;
            return;
        }

        tbody.innerHTML = logs.map(log => {
            const actionClass = log.action === 'Penambahan' ? 'action-add'
                : log.action === 'Pemakaian' ? 'action-use' : 'action-correction';
            const actionIcon = log.action === 'Penambahan' ? '🔺'
                : log.action === 'Pemakaian' ? '🔻' : '🔄';
            const changeDisplay = log.change_amount > 0
                ? `+${formatNumber(log.change_amount)}`
                : formatNumber(log.change_amount);

            const dateObj = new Date(log.created_at);
            const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

            return `
            <tr>
                <td class="td-date">
                    <span class="date-main">${dateStr}</span>
                    <span class="date-time">${timeStr}</span>
                </td>
                <td class="td-reagent">${escapeHtml(log.reagent_name || '-')}</td>
                <td class="td-action">
                    <span class="action-badge ${actionClass}">${actionIcon} ${log.action}</span>
                </td>
                <td class="td-number">${formatNumber(log.old_stock)}</td>
                <td class="td-number">${formatNumber(log.new_stock)}</td>
                <td class="td-change ${log.change_amount > 0 ? 'positive' : 'negative'}">
                    ${changeDisplay} ${escapeHtml(log.reagent_unit || '')}
                </td>
                <td class="td-notes">${escapeHtml(log.notes || '-')}</td>
            </tr>`;
        }).join('');
    }

    // --------------------------------------------------------
    // RENDER: Kartu dashboard
    // --------------------------------------------------------
    function renderDashboard(summary) {
        const fields = {
            'dash-total': summary?.total_reagents ?? '—',
            'dash-low': summary?.low_stock_count ?? '—',
            'dash-empty': summary?.empty_stock_count ?? '—',
            'dash-expired': summary?.expired_count ?? '—',
            'dash-expiring': summary?.expiring_soon_count ?? '—',
            'dash-liquid': summary?.liquid_count ?? '—',
            'dash-solid': summary?.solid_count ?? '—',
        };
        Object.entries(fields).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }

    // --------------------------------------------------------
    // MODAL: Show modal dengan konten tertentu
    // --------------------------------------------------------
    function showModal(title, bodyHtml, footerHtml = '') {
        const overlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalFooter = document.getElementById('modal-footer');

        if (!overlay) return;
        modalTitle.textContent = title;
        modalBody.innerHTML = bodyHtml;
        modalFooter.innerHTML = footerHtml;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus trap: focus ke elemen pertama yang bisa difokus
        setTimeout(() => {
            const firstInput = modalBody.querySelector('input, select, textarea, button');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    function hideModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // --------------------------------------------------------
    // TOAST: Notifikasi non-blocking
    // type: 'success' | 'error' | 'warning' | 'info'
    // --------------------------------------------------------
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
            <span class="toast-message">${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        // Animasi masuk
        requestAnimationFrame(() => toast.classList.add('show'));

        // Auto-remove setelah durasi
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, APP_CONFIG.toastDuration);
    }

    // --------------------------------------------------------
    // LOADING: Toggle loading state pada tombol
    // --------------------------------------------------------
    function setButtonLoading(btn, isLoading, originalText = null) {
        if (!btn) return;
        if (isLoading) {
            btn.dataset.originalText = btn.textContent;
            btn.textContent = '⏳ Memproses...';
            btn.disabled = true;
        } else {
            btn.textContent = originalText || btn.dataset.originalText || btn.textContent;
            btn.disabled = false;
        }
    }

    // --------------------------------------------------------
    // LOADING: Toggle loading overlay pada section
    // --------------------------------------------------------
    function setLoading(containerId, isLoading) {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (isLoading) {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Memuat data...</p>
                </div>`;
        }
    }

    // --------------------------------------------------------
    // EXPORT CSV: Download data sebagai file CSV
    // --------------------------------------------------------
    function exportToCSV(data, filename = 'export.csv') {
        if (!data || data.length === 0) {
            showToast('Tidak ada data untuk diekspor.', 'warning');
            return;
        }

        // Ambil header dari keys objek pertama
        const headers = Object.keys(data[0]);
        const csvRows = [
            headers.join(','), // Header row
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Wrap dalam tanda kutip jika ada koma atau newline
                    if (value === null || value === undefined) return '';
                    const str = String(value);
                    return str.includes(',') || str.includes('\n') || str.includes('"')
                        ? `"${str.replace(/"/g, '""')}"` // Escape tanda kutip ganda
                        : str;
                }).join(',')
            )
        ];

        const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM untuk Excel UTF-8
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`File "${filename}" berhasil diunduh.`, 'success');
    }

    // --------------------------------------------------------
    // SECURITY: Escape HTML untuk mencegah XSS
    // --------------------------------------------------------
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Expose ke luar
    return {
        isExpired,
        isExpiringSoon,
        getStockStatus,
        formatDate,
        formatNumber,
        renderReagentCard,
        renderReagentList,
        renderLogTable,
        renderDashboard,
        showModal,
        hideModal,
        showToast,
        setButtonLoading,
        setLoading,
        exportToCSV,
        escapeHtml,
    };
})();

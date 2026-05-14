// ============================================================
// js/barcode-scanner.js
// Modul untuk scan barcode via kamera dan generate barcode ID
// Menggunakan library html5-qrcode (CDN)
// ============================================================

const BarcodeModule = (() => {
    'use strict';

    let html5QrCode = null;
    let isScanning = false;

    // --------------------------------------------------------
    // SCAN: Buka kamera dan scan barcode
    // callback(decodedText) dipanggil saat barcode berhasil dibaca
    // --------------------------------------------------------
    async function startScan(callback) {
        const scannerOverlay = document.getElementById('scanner-overlay');
        const scannerContainer = document.getElementById('scanner-reader');

        if (!scannerOverlay || !scannerContainer) {
            UIHelpers.showToast('Elemen scanner tidak ditemukan.', 'error');
            return;
        }

        // Tampilkan overlay scanner
        scannerOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Bersihkan container
        scannerContainer.innerHTML = '';

        try {
            html5QrCode = new Html5Qrcode('scanner-reader');

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 150 },
                aspectRatio: 1.0,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.EAN_8,
                    Html5QrcodeSupportedFormats.UPC_A,
                    Html5QrcodeSupportedFormats.UPC_E,
                    Html5QrcodeSupportedFormats.QR_CODE,
                ],
            };

            isScanning = true;

            await html5QrCode.start(
                { facingMode: 'environment' }, // Kamera belakang
                config,
                (decodedText) => {
                    // Berhasil scan!
                    console.log('[Barcode] Scan berhasil:', decodedText);
                    stopScan();
                    if (callback) callback(decodedText);
                    UIHelpers.showToast(`Barcode terdeteksi: ${decodedText}`, 'success');
                },
                (errorMessage) => {
                    // Masih mencari barcode (tidak perlu ditampilkan)
                }
            );
        } catch (err) {
            console.error('[Barcode] Gagal memulai scanner:', err);
            stopScan();

            if (err.toString().includes('NotAllowedError')) {
                UIHelpers.showToast('Akses kamera ditolak. Izinkan akses kamera di pengaturan browser.', 'error');
            } else if (err.toString().includes('NotFoundError')) {
                UIHelpers.showToast('Kamera tidak ditemukan pada perangkat ini.', 'error');
            } else {
                UIHelpers.showToast('Gagal membuka kamera: ' + err, 'error');
            }
        }
    }

    // --------------------------------------------------------
    // STOP SCAN: Hentikan kamera dan tutup overlay
    // --------------------------------------------------------
    async function stopScan() {
        const scannerOverlay = document.getElementById('scanner-overlay');

        if (html5QrCode && isScanning) {
            try {
                await html5QrCode.stop();
                html5QrCode.clear();
            } catch (e) {
                console.warn('[Barcode] Error saat menghentikan scanner:', e);
            }
        }

        isScanning = false;
        html5QrCode = null;

        if (scannerOverlay) scannerOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // --------------------------------------------------------
    // GENERATE: Buat barcode ID otomatis (format RGN-XXX)
    // --------------------------------------------------------
    async function generateBarcodeId() {
        try {
            // Ambil barcode ID terakhir dari database untuk menentukan nomor berikutnya
            const { data, error } = await window.supabaseClient
                .from('reagents')
                .select('barcode_id')
                .like('barcode_id', 'RGN-%')
                .order('barcode_id', { ascending: false })
                .limit(1);

            if (error) {
                console.error('[Barcode] Gagal mengambil barcode terakhir:', error);
                return generateFallbackId();
            }

            if (!data || data.length === 0) {
                return 'RGN-001';
            }

            // Extract angka dari barcode terakhir (misal: RGN-010 → 10)
            const lastBarcode = data[0].barcode_id;
            const match = lastBarcode.match(/RGN-(\d+)/);
            if (match) {
                const nextNum = parseInt(match[1], 10) + 1;
                return `RGN-${String(nextNum).padStart(3, '0')}`;
            }

            return generateFallbackId();
        } catch (e) {
            console.error('[Barcode] Error saat generate ID:', e);
            return generateFallbackId();
        }
    }

    // Fallback: generate berdasarkan timestamp
    function generateFallbackId() {
        const now = new Date();
        const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        return `RGN-${ts}-${rand}`;
    }

    // --------------------------------------------------------
    // CHECK: Apakah perangkat mendukung kamera?
    // --------------------------------------------------------
    function isCameraSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }

    return { startScan, stopScan, generateBarcodeId, isCameraSupported };
})();

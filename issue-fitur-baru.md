# 🚀 Implementation Plan: Fitur Tambahan (V2) Stok Reagen Lab

## Deskripsi
Dokumen ini berisi panduan implementasi tingkat tinggi (high-level) untuk menambahkan 3 fitur baru pada aplikasi Stok Reagen Lab. Panduan ini dirancang agar mudah dibaca oleh Anda saat belajar mandiri, atau bisa dijadikan *prompt* untuk model AI yang akan membantu Anda menulis kode.

---

## 🔒 Fitur 1: Sistem Keamanan & Login (Supabase Auth)
**Tujuan:** Melindungi aplikasi agar hanya Anda (atau user yang diizinkan) yang bisa melihat dan mengubah data inventaris lab.

### Tahapan Implementasi:
1. **Setup Supabase Auth (Dashboard):**
   - Buka dashboard Supabase > menu **Authentication** > **Providers**. Pastikan provider **Email** menyala.
   - Buka menu **Users** di Supabase, lalu buat satu user secara manual (misal: `admin@lab.com` dengan password rahasia).
2. **Update RLS PostgreSQL (Database):**
   - Buka SQL Editor di Supabase.
   - Buat *query* untuk mengubah kebijakan (Policy) pada tabel `reagents` dan `usage_logs`.
   - Ubah dari yang awalnya bebas diakses publik (`anon`) menjadi hanya bisa diakses user yang login (`auth.role() = 'authenticated'`).
3. **Buat Halaman Login (Frontend - HTML & CSS):**
   - Di file `index.html`, buat sebuah `<div>` baru khusus untuk tampilan Login (berisi input email, password, dan tombol masuk).
   - Buat logika CSS: jika user belum login, tampilkan layar Login dan sembunyikan container `#app` (Dasbor utama).
4. **Logika JavaScript (Auth Flow):**
   - Gunakan fungsi `supabase.auth.signInWithPassword()` untuk memproses login.
   - Gunakan fungsi `supabase.auth.onAuthStateChange()` di `app.js` untuk mendeteksi secara otomatis apakah user sedang login atau logout.
   - Tambahkan tombol "Keluar/Logout" di menu navigasi atas.

---

## 🖨️ Fitur 2: Cetak Label Barcode Fisik
**Tujuan:** Menghasilkan gambar barcode (garis-garis hitam putih) yang bisa diprint pakai printer biasa/printer label, lalu ditempel di botol fisik.

### Tahapan Implementasi:
1. **Tambah Library JsBarcode:**
   - Tambahkan tag script CDN library `JsBarcode` di file `index.html` (mirip seperti saat menambahkan `html5-qrcode`).
2. **Modifikasi UI (HTML):**
   - Di dalam form Edit/Detail Reagen, tambahkan satu tombol baru: **"🖨️ Cetak Label"**.
   - Sediakan elemen `<svg id="barcode-canvas" style="display:none;"></svg>` di HTML untuk tempat menggambar barcodenya.
3. **Logika JavaScript (Generate & Print):**
   - Buat fungsi JS yang berjalan saat tombol cetak diklik.
   - Fungsi tersebut akan memanggil `JsBarcode("#barcode-canvas", "RGN-001")` untuk merender garis barcode.
   - Buat trik cetak: Fungsi JS akan membuka jendela/tab baru (`window.open`), lalu menyalin gambar barcode dan nama reagen ke jendela tersebut, dan memanggil fungsi `window.print()`.

---

## 📱 Fitur 3: Progressive Web App (PWA)
**Tujuan:** Aplikasi web bisa di-install layaknya aplikasi Android asli di HP (muncul icon di Home Screen dan bisa dibuka fullscreen tanpa address bar Chrome).

### Tahapan Implementasi:
1. **Siapkan Icon Aplikasi:**
   - Siapkan gambar logo/icon aplikasi dengan ukuran 192x192 pixel dan 512x512 pixel (format PNG).
   - Masukkan ke dalam folder baru, misalnya `icons/`.
2. **Buat file `manifest.json`:**
   - Buat file JSON baru bernama `manifest.json` di root folder.
   - Isi dengan konfigurasi PWA: `name`, `short_name`, `theme_color`, `background_color`, `display: "standalone"`, dan referensi link ke icon yang sudah disiapkan.
3. **Link Manifest ke HTML:**
   - Di file `index.html` bagian `<head>`, tambahkan `<link rel="manifest" href="manifest.json">`.
4. **Buat Service Worker (`sw.js`):**
   - Buat file JavaScript bernama `sw.js` di root folder.
   - Isi dengan logika dasar PWA (*caching* file statis seperti css dan js).
5. **Register Service Worker (app.js):**
   - Di file `app.js`, tambahkan kode untuk mendaftarkan `sw.js`:
     ```javascript
     if ('serviceWorker' in navigator) {
         navigator.serviceWorker.register('sw.js');
     }
     ```

---

## 💡 Cara Menggunakan Rencana Ini dengan Model AI
Jika Anda ingin meminta bantuan model AI (seperti Gemini, Claude, atau ChatGPT) untuk membuatkan kodenya, Anda bisa memberikan prompt (perintah) sederhana per fitur, misalnya:

*   **Prompt Fitur 1:** *"Saya punya aplikasi vanilla JS dengan Supabase. Tolong buatkan query SQL untuk mengaktifkan RLS agar tabel 'reagents' hanya bisa diakses user yang login (authenticated). Lalu berikan contoh kode JS untuk form login menggunakan Supabase Auth."*
*   **Prompt Fitur 2:** *"Bantu saya membuat fungsi JavaScript menggunakan library JsBarcode. Saya ingin ketika tombol diklik, sistem men-generate barcode dari string teks, lalu membuka print dialog browser secara otomatis untuk mengeprint barcode tersebut."*
*   **Prompt Fitur 3:** *"Tolong buatkan template file manifest.json standar untuk PWA dan contoh kode file sw.js dasar untuk cache aplikasi vanilla HTML JS."*

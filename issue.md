# 🧪 Implementasi Aplikasi Dokumentasi Stok Reagen Kimia (Free Tier)

## Deskripsi Proyek

Aplikasi web personal untuk dokumentasi dan manajemen stok reagen kimia di laboratorium.
Reagen kimia memiliki dua bentuk: **Cair** (satuan: mL, L) dan **Padat** (satuan: g, kg).

### Tujuan Utama
- Mencatat inventaris reagen kimia (nama, bentuk, stok, lokasi, tanggal kedaluwarsa)
- Mencatat setiap penggunaan/penambahan stok (audit trail)
- Memberikan peringatan visual untuk stok rendah dan reagen kedaluwarsa
- Kemampuan pencarian dan filter data
- Ekspor data ke CSV untuk pelaporan

---

## 🛠️ Tech Stack (100% Free Tier)

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| **Database** | [Supabase](https://supabase.com) PostgreSQL (Free Tier) | 500MB storage, unlimited API requests, built-in auth |
| **Frontend** | HTML + Vanilla CSS + Vanilla JavaScript | Tanpa framework = tanpa build step, mudah dipelajari |
| **Hosting** | [Vercel](https://vercel.com) atau [Netlify](https://netlify.com) (Free Tier) | Deploy gratis untuk static site |

> **Catatan**: Tech stack ini dipilih agar **$0/bulan** dan cocok untuk programmer yang sedang belajar.
> Supabase Free Tier: 500MB DB, 1GB file storage, 50K monthly active users.

---

## 📐 Arsitektur High-Level

```
┌─────────────────────────────────────────────────┐
│                   BROWSER                       │
│  ┌───────────┐ ┌───────────┐ ┌───────────────┐ │
│  │ index.html│ │ style.css │ │   app.js      │ │
│  │ (halaman) │ │ (tampilan)│ │ (logika)      │ │
│  └───────────┘ └───────────┘ └───────┬───────┘ │
└──────────────────────────────────────┼──────────┘
                                       │ fetch() API calls
                                       ▼
┌─────────────────────────────────────────────────┐
│              SUPABASE (Cloud)                   │
│  ┌──────────┐ ┌──────────┐ ┌────────────────┐  │
│  │PostgreSQL│ │ REST API │ │ Auth (opsional)│  │
│  │ Database │ │ (auto)   │ │                │  │
│  └──────────┘ └──────────┘ └────────────────┘  │
│  ┌──────────────────────────────────────────┐   │
│  │ Triggers & Views (otomatis audit trail)  │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 📊 Struktur Database

### Tabel: `reagents`
Menyimpan data master reagen kimia.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `UUID` (PK) | Auto-generate |
| `name` | `TEXT` NOT NULL | Nama reagen (contoh: "HCl 37%") |
| `form` | `TEXT` NOT NULL | `'Cair'` atau `'Padat'` |
| `current_stock` | `NUMERIC` NOT NULL | Jumlah stok saat ini |
| `unit` | `TEXT` NOT NULL | Satuan: `'mL'`, `'L'`, `'g'`, `'kg'` |
| `min_stock_threshold` | `NUMERIC` DEFAULT 0 | Batas minimum sebelum peringatan |
| `location` | `TEXT` | Lokasi penyimpanan (contoh: "Rak A-1") |
| `barcode_id` | `TEXT` UNIQUE | ID barcode unik (contoh: "RGN-001") |
| `expiry_date` | `DATE` | Tanggal kedaluwarsa |
| `notes` | `TEXT` | Catatan tambahan (opsional) |
| `created_at` | `TIMESTAMPTZ` | Auto: waktu dibuat |
| `updated_at` | `TIMESTAMPTZ` | Auto: waktu terakhir diupdate |

### Tabel: `usage_logs`
Audit trail otomatis setiap perubahan stok.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `UUID` (PK) | Auto-generate |
| `reagent_id` | `UUID` (FK → reagents.id) | Referensi ke reagen |
| `old_stock` | `NUMERIC` | Stok sebelum perubahan |
| `new_stock` | `NUMERIC` | Stok setelah perubahan |
| `change_amount` | `NUMERIC` | Selisih (positif = tambah, negatif = kurang) |
| `action` | `TEXT` | `'Penambahan'` / `'Pemakaian'` / `'Koreksi'` |
| `notes` | `TEXT` | Catatan penggunaan |
| `created_at` | `TIMESTAMPTZ` | Auto: waktu perubahan |

### Trigger: `log_stock_change`
Trigger PostgreSQL yang **otomatis** mencatat ke `usage_logs` setiap kali `current_stock` di tabel `reagents` berubah.

### Views
- `usage_logs_with_reagent` — JOIN usage_logs + reagents untuk menampilkan nama reagen
- `expired_reagents` — Reagen yang sudah kedaluwarsa
- `low_stock_reagents` — Reagen yang stoknya di bawah threshold
- `dashboard_summary` — Ringkasan: total reagen, stok rendah, expired

---

## 🗂️ Struktur File Proyek

```
project-aplikasi-stok-regen-free-tier/
├── index.html              # Halaman utama (single page app)
├── css/
│   └── style.css           # Semua styling
├── js/
│   ├── config.js           # Konfigurasi Supabase (URL, anon key)
│   ├── supabase-client.js  # Inisialisasi Supabase client
│   ├── app.js              # Entry point, routing, event listeners
│   ├── reagent-service.js  # CRUD operations untuk reagents
│   ├── log-service.js      # Query operations untuk usage_logs
│   └── ui-helpers.js       # Render HTML, modal, toast, export CSV
├── sql/
│   ├── 01_tables.sql       # CREATE TABLE reagents, usage_logs
│   ├── 02_triggers.sql     # Trigger log_stock_change
│   ├── 03_views.sql        # Views (expired, low_stock, dashboard)
│   ├── 04_rls.sql          # Row Level Security policies
│   └── 05_seed.sql         # Sample data untuk testing
└── README.md               # Dokumentasi cara setup & deploy
```

---

## 🚀 Fase Implementasi

---

### FASE 1: Setup Database Supabase
**Estimasi: 30-60 menit**

**Prasyarat:** Buat akun Supabase (gratis) dan buat project baru.

#### Task 1.1: Buat tabel `reagents` dan `usage_logs`
- Buat file `sql/01_tables.sql`
- Tulis `CREATE TABLE public.reagents` dengan semua kolom di atas
- Tulis `CREATE TABLE public.usage_logs` dengan FK ke reagents
- Tambahkan index pada `barcode_id`, `expiry_date`, dan `form`

#### Task 1.2: Buat trigger audit trail
- Buat file `sql/02_triggers.sql`
- Tulis function `log_stock_change()` yang:
  - Cek apakah `current_stock` berubah (`OLD.current_stock != NEW.current_stock`)
  - Insert ke `usage_logs` dengan `old_stock`, `new_stock`, `change_amount`
  - Set `action` otomatis: `'Penambahan'` jika stok naik, `'Pemakaian'` jika turun, `'Koreksi'` jika lainnya
  - Update `updated_at` pada row reagen
- Buat trigger `BEFORE UPDATE ON reagents` yang memanggil function ini

#### Task 1.3: Buat views
- Buat file `sql/03_views.sql`
- `usage_logs_with_reagent`: JOIN untuk menampilkan nama reagen di log
- `expired_reagents`: `WHERE expiry_date < CURRENT_DATE`
- `low_stock_reagents`: `WHERE current_stock < min_stock_threshold`
- `dashboard_summary`: `SELECT count(*)`, count expired, count low stock

#### Task 1.4: Setup RLS (Row Level Security)
- Buat file `sql/04_rls.sql`
- Untuk aplikasi personal, enable RLS lalu buat policy `USING (true)` agar anon key bisa akses
- Atau disable RLS jika hanya untuk personal use

#### Task 1.5: Seed data
- Buat file `sql/05_seed.sql`
- Insert 5-10 contoh reagen (campuran cair & padat)
- Contoh: HCl 37% (Cair, mL), NaOH Pellet (Padat, g), Etanol 96% (Cair, mL), dll.

**Cara menjalankan:** Copy-paste setiap file SQL ke Supabase Dashboard → SQL Editor → Run

**✅ Kriteria Selesai Fase 1:**
- Semua tabel & views muncul di Supabase Table Editor
- Test: `UPDATE reagents SET current_stock = 999 WHERE barcode_id = 'RGN-001'` → cek `usage_logs` terisi otomatis

---

### FASE 2: Setup Project Frontend
**Estimasi: 1-2 jam**

#### Task 2.1: Buat `index.html`
- Satu file HTML sebagai single-page app
- Struktur:
  - **Header**: Judul app + tombol navigasi tab (Dashboard, Daftar, Riwayat)
  - **Section Dashboard**: Ringkasan stok (total, rendah, expired) dalam card
  - **Section Daftar Reagen**: Tabel/card list semua reagen dengan indikator warna
  - **Section Detail/Form**: Form tambah/edit reagen, form pemakaian stok
  - **Section Riwayat**: Tabel log perubahan stok
  - **Modal**: Konfirmasi hapus, form input
- Gunakan `<section>` yang di-show/hide dengan JS (tab-based navigation)
- Include Supabase JS client dari CDN:
  ```html
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  ```

#### Task 2.2: Buat `css/style.css`
- **Tema**: Lab-inspired clean design, dark/light mode (pilih salah satu)
- **Design system** (CSS custom properties):
  - Warna utama, aksen, background, text
  - Font: Google Fonts (Inter atau Roboto)
  - Spacing scale, border-radius, shadows
- **Indikator stok** (warna):
  - 🟢 Hijau (`#22C55E`): Stok aman (`current_stock >= min_stock_threshold`)
  - 🟡 Kuning (`#F59E0B`): Stok rendah (`current_stock < min_stock_threshold` dan `> 0`)
  - 🔴 Merah (`#EF4444`): Stok habis (`current_stock <= 0`) atau expired
- Responsive design (mobile-friendly, min viewport 360px)
- Animasi transisi halus untuk show/hide sections
- Gunakan CSS Grid/Flexbox untuk layout

#### Task 2.3: Buat `js/config.js`
```javascript
// Ganti dengan nilai dari Supabase Dashboard → Settings → API
const SUPABASE_URL = 'https://[PROJECT-ID].supabase.co';
const SUPABASE_ANON_KEY = '[ANON-KEY]';
```

#### Task 2.4: Buat `js/supabase-client.js`
- Inisialisasi Supabase client menggunakan `supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`
- Export/expose client ke `window` untuk digunakan di file JS lain

**✅ Kriteria Selesai Fase 2:**
- Buka `index.html` di browser → halaman tampil dengan layout & navigasi
- Console: bisa fetch data dari Supabase (`supabaseClient.from('reagents').select('*')`)

---

### FASE 3: Implementasi CRUD Reagen
**Estimasi: 2-3 jam**

#### Task 3.1: Buat `js/reagent-service.js`
Implementasi fungsi-fungsi berikut:

| Fungsi | Deskripsi | Supabase Method |
|--------|-----------|-----------------|
| `getAllReagents()` | Ambil semua reagen, urutkan by nama | `.from('reagents').select('*').order('name')` |
| `getReagentById(id)` | Ambil satu reagen by ID | `.from('reagents').select('*').eq('id', id).single()` |
| `searchByBarcode(barcode)` | Cari reagen by barcode_id | `.from('reagents').select('*').eq('barcode_id', barcode).single()` |
| `createReagent(data)` | Tambah reagen baru | `.from('reagents').insert(data)` |
| `updateReagent(id, data)` | Update data reagen | `.from('reagents').update(data).eq('id', id)` |
| `updateStock(id, newStock)` | Update stok (trigger log otomatis) | `.from('reagents').update({ current_stock: newStock }).eq('id', id)` |
| `deleteReagent(id)` | Hapus reagen | `.from('reagents').delete().eq('id', id)` |
| `getExpiredReagents()` | Ambil dari view `expired_reagents` | `.from('expired_reagents').select('*')` |
| `getLowStockReagents()` | Ambil dari view `low_stock_reagents` | `.from('low_stock_reagents').select('*')` |
| `getDashboardSummary()` | Ambil dari view `dashboard_summary` | `.from('dashboard_summary').select('*').single()` |

#### Task 3.2: Buat `js/log-service.js`

| Fungsi | Deskripsi |
|--------|-----------|
| `getAllLogs(limit)` | Ambil semua log, urutkan terbaru, dengan limit |
| `getLogsByReagent(reagentId)` | Ambil log untuk reagen tertentu |

> **PENTING**: TIDAK perlu fungsi `createLog()` — trigger database yang otomatis mencatat setiap perubahan stok!

**✅ Kriteria Selesai Fase 3:**
- Semua fungsi service bisa dipanggil dari browser console dan return data yang benar
- `createReagent()` berhasil insert → muncul di Supabase Table Editor
- `updateStock()` berhasil → `usage_logs` terisi otomatis oleh trigger

---

### FASE 4: Implementasi UI & Interaksi
**Estimasi: 3-5 jam**

#### Task 4.1: Buat `js/ui-helpers.js`
Fungsi-fungsi helper untuk render UI:

- `renderReagentCard(reagent)` — Render card satu reagen dengan indikator warna status
- `renderReagentList(reagents)` — Render list/grid semua reagen
- `renderLogTable(logs)` — Render tabel riwayat penggunaan
- `renderDashboard(summary)` — Render card dashboard ringkasan
- `showModal(content)` / `hideModal()` — Show/hide modal dialog
- `showToast(message, type)` — Notifikasi toast (success/error/warning)
- `getStockStatusColor(reagent)` — Return warna CSS berdasarkan status stok
- `isExpired(expiryDate)` — Cek apakah sudah expired (`expiryDate < today`)

#### Task 4.2: Buat `js/app.js`
Entry point aplikasi — semua event listeners dan orchestrasi:

1. **Inisialisasi**: Load dashboard summary + daftar reagen saat halaman dibuka
2. **Navigasi Tab**: Event listener untuk switch antar section (Dashboard, Daftar, Riwayat)
3. **Form Tambah Reagen**:
   - Validasi input (nama wajib, stok >= 0, format bentuk Cair/Padat)
   - Satuan otomatis berdasarkan bentuk: Cair → mL/L, Padat → g/kg
   - Panggil `createReagent()` lalu refresh list
4. **Pemakaian Stok**:
   - Input jumlah yang dipakai
   - Hitung stok baru: `current_stock - jumlah_pakai`
   - Validasi: stok baru tidak boleh negatif
   - Panggil `updateStock()` → trigger otomatis catat log
   - Tampilkan toast sukses
5. **Penambahan Stok**:
   - Input jumlah yang ditambah
   - Hitung stok baru: `current_stock + jumlah_tambah`
   - Panggil `updateStock()`
6. **Pencarian**:
   - Search by nama (client-side filter dari data yang sudah di-load)
   - Search by barcode (query ke Supabase via `searchByBarcode()`)
7. **Filter**:
   - Chip/tab filter: Semua | Cair | Padat | Stok Rendah | Expired
   - Untuk Stok Rendah dan Expired, gunakan views dari Supabase
8. **Delete**: Konfirmasi modal sebelum hapus, lalu refresh list

**Mockup Layout Halaman:**
```
┌──────────────────────────────────────────┐
│  🧪 Stok Reagen Lab                     │
│  [Dashboard] [Daftar] [Riwayat]         │
├──────────────────────────────────────────┤
│                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐             │
│  │ 25   │ │  3   │ │  2   │  ← Cards    │
│  │Total │ │Rendah│ │Exprd │             │
│  └──────┘ └──────┘ └──────┘             │
│                                          │
│  🔍 [________________] [+ Tambah Baru]  │
│  [Semua][Cair][Padat][Rendah][Expired]  │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ 🟢 HCl 37%         2500 mL     │   │
│  │    Cair | Rak A-1 | Exp: 2027   │   │
│  ├──────────────────────────────────┤   │
│  │ 🟡 NaOH Pellet      150 g      │   │
│  │    Padat | Rak B-2 | Exp: 2028  │   │
│  ├──────────────────────────────────┤   │
│  │ 🔴 Etanol 96%        0 mL      │   │
│  │    Cair | Rak A-3 | EXPIRED     │   │
│  └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

**✅ Kriteria Selesai Fase 4:**
- Semua section navigasi berfungsi
- CRUD reagen lengkap dari UI (tambah, edit, hapus)
- Pemakaian/penambahan stok berfungsi + log tercatat otomatis
- Pencarian dan filter bekerja
- Indikator warna stok tampil sesuai kondisi

---

### FASE 5: Fitur Ekspor CSV
**Estimasi: 1 jam**

#### Task 5.1: Implementasi fungsi ekspor di `js/ui-helpers.js`
- `exportToCSV(data, filename)`:
  - Terima array of objects
  - Konversi ke CSV string (header dari keys + rows dari values)
  - Buat `Blob` dengan type `text/csv`
  - Buat `<a>` element, set `href` ke `URL.createObjectURL(blob)`, set `download` attribute
  - Trigger klik programmatik untuk mulai download
- Tombol "📥 Ekspor CSV" di section Daftar Reagen dan section Riwayat
- Data yang bisa diekspor:
  - Daftar semua reagen (inventaris lengkap)
  - Riwayat penggunaan stok (audit trail)

**✅ Kriteria Selesai Fase 5:**
- Klik tombol ekspor → file `.csv` terdownload
- Buka CSV di Excel/Google Sheets → data benar dan lengkap

---

### FASE 6: Polish & Deploy
**Estimasi: 1-2 jam**

#### Task 6.1: Responsive & Accessibility
- Test di mobile viewport (360px, 390px, 414px)
- Pastikan `<meta name="viewport" content="width=device-width, initial-scale=1.0">` ada
- Pastikan font readable, button cukup besar untuk touch (min 44x44px)

#### Task 6.2: Error Handling
- Handle network error (Supabase down / user offline)
- Tampilkan pesan error yang user-friendly (bukan raw error)
- Loading state/spinner saat fetch data

#### Task 6.3: Deploy ke Vercel/Netlify
- Push code ke GitHub repository
- Connect repo ke Vercel atau Netlify
- Deploy sebagai static site
- **Jangan lupa**: `config.js` berisi anon key yang memang boleh public (RLS melindungi data)

#### Task 6.4: Buat `README.md`
- Deskripsi singkat aplikasi
- Cara setup Supabase (buat project, jalankan SQL files secara berurutan)
- Cara konfigurasi `js/config.js` (masukkan URL & anon key)
- Cara run lokal (buka `index.html` di browser, atau gunakan VS Code Live Server extension)
- Cara deploy ke Vercel/Netlify

**✅ Kriteria Selesai Fase 6:**
- Aplikasi responsive di mobile dan desktop
- Error handling menampilkan pesan yang jelas
- Aplikasi live di URL publik
- README lengkap

---

## ⚠️ Batasan Free Tier Supabase

| Resource | Limit Free Tier |
|----------|----------------|
| Database | 500 MB |
| File Storage | 1 GB |
| Edge Functions | 500K invocations/month |
| Bandwidth | 5 GB/month |
| Pausing | Project di-pause setelah 1 minggu tidak aktif |

> **Tips**: Untuk menghindari auto-pause, kunjungi app secara rutin atau setup cron ping sederhana.

---

## 💡 Catatan untuk AI Model / Programmer Pemula

1. **Kerjakan per-fase secara berurutan**. Pastikan database sudah benar sebelum mulai frontend.
2. **Test di setiap langkah**. Setelah buat tabel → test insert. Setelah buat trigger → test update. Setelah buat fungsi JS → test di console browser.
3. **Supabase client dari CDN** — tidak perlu npm/node. Cukup tambahkan `<script>` tag di HTML.
4. **Trigger = magic**. Anda TIDAK perlu menulis kode JS untuk mencatat log. Cukup update `current_stock`, trigger PostgreSQL yang mengurus sisanya.
5. **Jangan commit credentials** ke GitHub public repo. Gunakan `.gitignore` untuk `js/config.js`.
6. **Mulai dari yang simple**. Buat tampilan basic yang fungsional dulu, baru tambahkan animasi dan polish di Fase 6.
7. **Setiap Task bisa dijadikan 1 prompt** ke AI model. Contoh: "Buatkan file `sql/01_tables.sql` berdasarkan spesifikasi tabel di atas".

# 🧪 Stok Reagen Lab

Aplikasi web personal untuk dokumentasi dan manajemen stok reagen kimia laboratorium.
Mendukung reagen **Cair** (mL, L) dan **Padat** (g, kg).

**Tech Stack: 100% Free Tier**
- 🗄️ **Database**: [Supabase](https://supabase.com) (PostgreSQL)
- 🌐 **Frontend**: HTML + CSS + JavaScript (Vanilla)
- 🚀 **Hosting**: [Vercel](https://vercel.com) atau [Netlify](https://netlify.com)

---

## ✨ Fitur

- ✅ Inventaris reagen lengkap (nama, bentuk, stok, satuan, lokasi, barcode, kedaluwarsa)
- ✅ Indikator warna stok: 🟢 Aman / 🟡 Rendah / 🔴 Habis/Expired
- ✅ Audit trail otomatis via PostgreSQL trigger (tanpa kode tambahan)
- ✅ Pencarian & filter (Semua / Cair / Padat / Stok Rendah / Expired)
- ✅ Pemakaian & penambahan stok dengan catatan
- ✅ Ekspor inventaris & riwayat ke CSV
- ✅ Dashboard ringkasan statistik
- ✅ Responsive (mobile & desktop)

---

## ⚙️ Setup (Ikuti Urutan Ini!)

### Langkah 1: Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) → Login → **New Project**
2. Isi nama project, pilih region terdekat (Singapore), set password database
3. Tunggu project selesai dibuat (~2 menit)

### Langkah 2: Jalankan SQL (berurutan!)

Buka **Supabase Dashboard → SQL Editor → New Query**, lalu copy-paste dan jalankan setiap file SQL **secara berurutan**:

| Urutan | File | Isi |
|--------|------|-----|
| 1️⃣ | `sql/01_tables.sql` | Buat tabel `reagents` dan `usage_logs` |
| 2️⃣ | `sql/02_triggers.sql` | Trigger audit trail otomatis |
| 3️⃣ | `sql/03_views.sql` | Views untuk filter & dashboard |
| 4️⃣ | `sql/04_rls.sql` | Row Level Security |
| 5️⃣ | `sql/05_seed.sql` | Data contoh (opsional) |

> ⚠️ **Penting**: Jalankan `01_tables.sql` dulu sebelum file lainnya!

### Langkah 3: Konfigurasi Aplikasi

1. Buka **Supabase Dashboard → Settings → API**
2. Copy **Project URL** dan **anon public key**
3. Edit file `js/config.js`:

```javascript
const SUPABASE_URL = 'https://XXXXXXXXXXXX.supabase.co'; // ganti ini
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // dan ini
```

### Langkah 4: Jalankan Lokal

Buka `index.html` langsung di browser, **atau** gunakan VS Code Live Server:
1. Install ekstensi [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) di VS Code
2. Klik kanan `index.html` → **Open with Live Server**
3. Buka `http://localhost:5500`

### Langkah 5: Deploy (Opsional)

**Dengan Vercel:**
```bash
# Push ke GitHub dulu
git add .
git commit -m "Initial commit"
git push

# Kemudian buka vercel.com, import repo GitHub, deploy otomatis
```

**Dengan Netlify:**
- Drag & drop folder project ke [netlify.com/drop](https://app.netlify.com/drop)

---

## 🗂️ Struktur File

```
project-aplikasi-stok-regen-free-tier/
├── index.html              # Halaman utama (single page app)
├── css/
│   └── style.css           # Semua styling (dark theme)
├── js/
│   ├── config.js           ⚠️ ISI INI DULU: Supabase URL & anon key
│   ├── supabase-client.js  # Init Supabase client
│   ├── reagent-service.js  # CRUD tabel reagents
│   ├── log-service.js      # Query usage_logs
│   ├── ui-helpers.js       # Render, modal, toast, CSV export
│   └── app.js              # Entry point & event listeners
├── sql/
│   ├── 01_tables.sql       # Tabel reagents & usage_logs
│   ├── 02_triggers.sql     # Trigger log otomatis
│   ├── 03_views.sql        # Views expired, low_stock, dashboard
│   ├── 04_rls.sql          # Row Level Security
│   └── 05_seed.sql         # Sample data
└── README.md
```

---

## 🧪 Test Trigger Database

Setelah setup selesai, test di Supabase SQL Editor:

```sql
-- 1. Lihat stok sebelum update
SELECT name, current_stock FROM reagents WHERE barcode_id = 'RGN-001';

-- 2. Update stok (trigger akan otomatis catat log)
UPDATE reagents SET current_stock = 1500 WHERE barcode_id = 'RGN-001';

-- 3. Cek log otomatis tercatat
SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT 3;
```

---

## ⚠️ Batasan Supabase Free Tier

| Resource | Limit |
|----------|-------|
| Database | 500 MB |
| Bandwidth | 5 GB/bulan |
| Project Pausing | Pause setelah 1 minggu tidak aktif |

> **Tip**: Kunjungi aplikasi secara rutin agar project tidak di-pause.

---

## 📄 Lisensi

Personal use. Free to modify.

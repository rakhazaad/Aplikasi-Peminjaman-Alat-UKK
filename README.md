# Aplikasi Peminjaman Alat

Aplikasi web untuk manajemen peminjaman alat dengan 3 level pengguna: Admin, Petugas, dan Peminjam.

## Teknologi

- **Framework**: Next.js 14
- **Database**: PostgreSQL
- **Styling**: Tailwind CSS
- **Authentication**: JWT

## Fitur

### Admin
- CRUD User
- CRUD Alat
- CRUD Kategori
- CRUD Peminjaman
- CRUD Pengembalian
- Log Aktifitas

### Petugas
- Menyetujui Peminjaman
- Memantau Pengembalian
- Mencetak Laporan

### Peminjam
- Melihat Daftar Alat
- Mengajukan Peminjaman
- Mengembalikan Alat

## Instalasi

1. Install dependencies:
```bash
npm install
```

2. Setup database (otomatis):
```bash
npm run setup-db
```
   Script ini akan:
   - Membuat database `peminjaman_alat` jika belum ada
   - Membuat semua tabel yang diperlukan
   - Membuat user admin default

3. Konfigurasi database (jika diperlukan):
   - Edit `scripts/setup-database.js` jika koneksi database berbeda
   - Default: localhost:5432, username: postgres, password: genius2299

4. Jalankan aplikasi:
```bash
npm run dev
```

5. Buka browser di `http://localhost:3000`

## Default Login

Setelah menjalankan `npm run setup-db`:
- **Username**: admin
- **Password**: admin123

## Struktur Project

```
├── app/
│   ├── admin/          # Halaman admin
│   ├── petugas/        # Halaman petugas
│   ├── peminjam/       # Halaman peminjam
│   ├── api/            # API routes
│   ├── login/          # Halaman login
│   └── page.js         # Dashboard
├── components/         # Komponen React
├── lib/                # Utilities & database
├── scripts/            # Setup scripts
└── middleware.js       # Next.js middleware
```

## Catatan

- Pastikan PostgreSQL sudah berjalan sebelum menjalankan `npm run setup-db`
- Default admin password harus diubah setelah setup pertama
- Semua password disimpan dalam format hash bcrypt

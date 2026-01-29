-- Create database (run this manually in pgAdmin)
-- CREATE DATABASE peminjaman_alat;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'petugas', 'peminjam')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS kategori (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment table
CREATE TABLE IF NOT EXISTS alat (
  id SERIAL PRIMARY KEY,
  nama VARCHAR(255) NOT NULL,
  kategori_id INTEGER REFERENCES kategori(id) ON DELETE SET NULL,
  deskripsi TEXT,
  jumlah INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'tersedia' CHECK (status IN ('tersedia', 'dipinjam', 'rusak')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loan requests table
CREATE TABLE IF NOT EXISTS peminjaman (
  id SERIAL PRIMARY KEY,
  peminjam_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  alat_id INTEGER REFERENCES alat(id) ON DELETE CASCADE,
  jumlah INTEGER NOT NULL DEFAULT 1,
  tanggal_pinjam DATE NOT NULL,
  tanggal_kembali DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'disetujui', 'ditolak', 'dipinjam', 'dikembalikan')),
  keterangan TEXT,
  petugas_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pengembalian (
  id SERIAL PRIMARY KEY,
  peminjaman_id INTEGER REFERENCES peminjaman(id) ON DELETE CASCADE,
  tanggal_kembali_aktual DATE NOT NULL,
  kondisi VARCHAR(20) DEFAULT 'baik' CHECK (kondisi IN ('baik', 'rusak', 'hilang')),
  keterangan TEXT,
  denda NUMERIC(12,2) DEFAULT 0,
  petugas_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity log table
CREATE TABLE IF NOT EXISTS log_aktifitas (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  aksi VARCHAR(255) NOT NULL,
  tabel VARCHAR(100),
  record_id INTEGER,
  detail TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Note: Admin user should be created using the setup script
-- Run: node scripts/setup-admin.js
-- Default credentials: username: admin, password: admin123

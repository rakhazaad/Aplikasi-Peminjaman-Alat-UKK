const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbConfig = {
  user: 'postgres',
  password: 'genius2299',
  host: 'localhost',
  port: 5432,
  database: 'postgres', // Connect to default database first
};

async function setupDatabase() {
  const adminPool = new Pool(dbConfig);

  try {
    console.log('Connecting to PostgreSQL...');
    
    // Check if database exists
    const dbCheck = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = 'peminjaman_alat'"
    );

    if (dbCheck.rows.length === 0) {
      console.log('Creating database peminjaman_alat...');
      await adminPool.query('CREATE DATABASE peminjaman_alat');
      console.log('✓ Database created successfully!');
    } else {
      console.log('✓ Database already exists.');
    }

    await adminPool.end();

    // Now connect to the new database
    const appPool = new Pool({
      ...dbConfig,
      database: 'peminjaman_alat',
    });

    console.log('Creating tables...');
    
    // Create tables one by one
    const createTables = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nama VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'petugas', 'peminjam')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS kategori (
        id SERIAL PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        deskripsi TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS alat (
        id SERIAL PRIMARY KEY,
        nama VARCHAR(255) NOT NULL,
        kategori_id INTEGER REFERENCES kategori(id) ON DELETE SET NULL,
        deskripsi TEXT,
        jumlah INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) DEFAULT 'tersedia' CHECK (status IN ('tersedia', 'dipinjam', 'rusak')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS peminjaman (
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
      )`,
      `CREATE TABLE IF NOT EXISTS pengembalian (
        id SERIAL PRIMARY KEY,
        peminjaman_id INTEGER REFERENCES peminjaman(id) ON DELETE CASCADE,
        tanggal_kembali_aktual DATE NOT NULL,
        kondisi VARCHAR(20) DEFAULT 'baik' CHECK (kondisi IN ('baik', 'rusak', 'hilang')),
        keterangan TEXT,
        petugas_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS log_aktifitas (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        aksi VARCHAR(255) NOT NULL,
        tabel VARCHAR(100),
        record_id INTEGER,
        detail TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const tableSQL of createTables) {
      try {
        await appPool.query(tableSQL);
      } catch (error) {
        console.error('Error creating table:', error.message);
        throw error;
      }
    }

    console.log('✓ Tables created successfully!');

    // Ensure denda column exists on pengembalian table
    try {
      await appPool.query("ALTER TABLE pengembalian ADD COLUMN IF NOT EXISTS denda NUMERIC(12,2) DEFAULT 0");
      console.log('✓ Column denda added/exists on pengembalian table');
    } catch (error) {
      console.error('Error ensuring denda column:', error.message);
      throw error;
    }

    // Create admin user
    console.log('Creating admin user...');
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const userResult = await appPool.query(
      'SELECT id FROM users WHERE username = $1',
      ['admin']
    );

    if (userResult.rows.length === 0) {
      await appPool.query(
        'INSERT INTO users (username, password, nama, role) VALUES ($1, $2, $3, $4)',
        ['admin', hashedPassword, 'Administrator', 'admin']
      );
      console.log('✓ Admin user created successfully!');
      console.log('  Username: admin');
      console.log('  Password: admin123');
    } else {
      console.log('✓ Admin user already exists.');
    }

    await appPool.end();

    console.log('\n✅ Database setup completed successfully!');
    console.log('\nYou can now run: npm run dev');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.error('\nMake sure:');
    console.error('1. PostgreSQL is running');
    console.error('2. Username and password are correct');
    console.error('3. You have permission to create databases');
    process.exit(1);
  }
}

setupDatabase();

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'genius2299',
  host: 'localhost',
  port: 5432,
  database: 'peminjaman_alat',
});

// Lazily ensure schema tweaks that older databases might miss (e.g. denda column, status updates).
let ensureSchemaPromise = null;
async function ensureSchema() {
  if (!ensureSchemaPromise) {
    ensureSchemaPromise = Promise.all([
      // Ensure denda column exists
      pool.query(
        'ALTER TABLE IF EXISTS pengembalian ADD COLUMN IF NOT EXISTS denda NUMERIC(12,2) DEFAULT 0'
      ).catch((err) => {
        console.error('Error ensuring denda column exists:', err);
      }),
      // Try to update peminjaman status constraint to include 'menunggu_konfirmasi'
      // Note: This might fail if constraint doesn't exist or is different, which is okay
      pool.query(`
        DO $$ 
        BEGIN
          -- Try to drop old constraint if it exists
          ALTER TABLE peminjaman DROP CONSTRAINT IF EXISTS peminjaman_status_check;
          -- Create new constraint with menunggu_konfirmasi
          ALTER TABLE peminjaman ADD CONSTRAINT peminjaman_status_check 
            CHECK (status IN ('pending', 'disetujui', 'ditolak', 'dipinjam', 'menunggu_konfirmasi', 'dikembalikan'));
        EXCEPTION
          WHEN others THEN
            -- If constraint already exists or other error, just continue
            NULL;
        END $$;
      `).catch((err) => {
        // This is okay - constraint might already be updated or table might not exist yet
        console.log('Note: Could not update peminjaman status constraint (this is usually okay):', err.message);
      }),
      // Create notifications table
      pool.query(`
        CREATE TABLE IF NOT EXISTS notifikasi (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          tipe VARCHAR(50) NOT NULL,
          judul VARCHAR(255) NOT NULL,
          pesan TEXT NOT NULL,
          dibaca BOOLEAN DEFAULT FALSE,
          link VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `).catch((err) => {
        console.log('Note: Could not create notifikasi table (this is usually okay):', err.message);
      })
    ]).catch((err) => {
      ensureSchemaPromise = null;
      console.error('Error ensuring schema:', err);
      throw err;
    });
  }
  return ensureSchemaPromise;
}

// Attach helper so routes can await before running queries
pool.ensureDendaColumn = ensureSchema; // Keep old name for backward compatibility
pool.ensureSchema = ensureSchema;

// Test connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;

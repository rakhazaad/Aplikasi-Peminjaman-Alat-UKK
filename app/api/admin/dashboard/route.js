import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (pool.ensureSchema) {
      await pool.ensureSchema();
    }

    // Get statistics
    const [usersCount, alatCount, kategoriCount] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM alat'),
      pool.query('SELECT COUNT(*) as count FROM kategori'),
    ]);

    // Get latest peminjaman (3 most recent)
    // Using id DESC as it's typically auto-incrementing and represents newest first
    const latestPeminjaman = await pool.query(`
      SELECT 
        p.id,
        p.jumlah,
        p.tanggal_pinjam,
        p.tanggal_kembali,
        p.status,
        u.nama as peminjam_nama,
        a.nama as alat_nama
      FROM peminjaman p
      LEFT JOIN users u ON p.peminjam_id = u.id
      LEFT JOIN alat a ON p.alat_id = a.id
      ORDER BY p.id DESC
      LIMIT 3
    `);

    // Get latest pengembalian (3 most recent)
    const latestPengembalian = await pool.query(`
      SELECT 
        pg.id,
        pg.tanggal_kembali_aktual,
        pg.kondisi,
        pg.keterangan,
        pg.denda,
        p.id as peminjaman_id,
        u.nama as peminjam_nama,
        a.nama as alat_nama
      FROM pengembalian pg
      LEFT JOIN peminjaman p ON pg.peminjaman_id = p.id
      LEFT JOIN users u ON p.peminjam_id = u.id
      LEFT JOIN alat a ON p.alat_id = a.id
      ORDER BY pg.id DESC
      LIMIT 3
    `);

    // Get latest log aktifitas (3 most recent)
    const latestLogs = await pool.query(`
      SELECT 
        l.id,
        l.aksi,
        l.tabel,
        l.record_id,
        l.detail,
        l.created_at,
        u.nama as user_nama
      FROM log_aktifitas l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.id DESC
      LIMIT 3
    `);

    return NextResponse.json({
      success: true,
      statistics: {
        totalUsers: parseInt(usersCount.rows[0].count, 10),
        totalAlat: parseInt(alatCount.rows[0].count, 10),
        totalKategori: parseInt(kategoriCount.rows[0].count, 10),
      },
      latestPeminjaman: latestPeminjaman.rows,
      latestPengembalian: latestPengembalian.rows,
      latestLogs: latestLogs.rows,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

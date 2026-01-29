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
    if (!decoded || decoded.role !== 'peminjam') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (pool.ensureSchema) {
      await pool.ensureSchema();
    }

    // Get total alat
    const alatCount = await pool.query('SELECT COUNT(*) as count FROM alat');

    // Get total kategori
    const kategoriCount = await pool.query('SELECT COUNT(*) as count FROM kategori');

    // Get latest pengembalian yang diajukan (status menunggu_konfirmasi atau dikembalikan) for this user
    // This should show peminjaman that have pengembalian record and status is menunggu_konfirmasi or dikembalikan
    const latestPengembalian = await pool.query(`
      SELECT 
        p.id as peminjaman_id,
        p.status,
        pg.id as pengembalian_id,
        pg.tanggal_kembali_aktual,
        pg.kondisi,
        pg.keterangan,
        pg.denda,
        a.nama as alat_nama,
        a.id as alat_id
      FROM peminjaman p
      INNER JOIN pengembalian pg ON pg.peminjaman_id = p.id
      LEFT JOIN alat a ON p.alat_id = a.id
      WHERE p.peminjam_id = $1 
        AND (p.status = 'menunggu_konfirmasi' OR p.status = 'dikembalikan')
      ORDER BY pg.id DESC
      LIMIT 3
    `, [decoded.id]);

    // Get latest peminjaman aktif (status disetujui or dipinjam) for this user
    const latestPeminjamanAktif = await pool.query(`
      SELECT 
        p.id,
        p.jumlah,
        p.tanggal_pinjam,
        p.tanggal_kembali,
        p.status,
        a.nama as alat_nama,
        a.id as alat_id
      FROM peminjaman p
      LEFT JOIN alat a ON p.alat_id = a.id
      WHERE p.peminjam_id = $1 
        AND (p.status = 'disetujui' OR p.status = 'dipinjam')
      ORDER BY p.id DESC
      LIMIT 3
    `, [decoded.id]);

    return NextResponse.json({
      success: true,
      statistics: {
        totalAlat: parseInt(alatCount.rows[0].count, 10),
        totalKategori: parseInt(kategoriCount.rows[0].count, 10),
      },
      latestPengembalian: latestPengembalian.rows,
      latestPeminjamanAktif: latestPeminjamanAktif.rows,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

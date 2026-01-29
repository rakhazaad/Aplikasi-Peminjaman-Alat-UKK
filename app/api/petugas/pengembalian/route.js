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
    if (!decoded || decoded.role !== 'petugas') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const result = await pool.query(`
      SELECT pg.*,
             u.nama as peminjam_nama,
             a.nama as alat_nama,
             p.status as peminjaman_status,
             p.tanggal_pinjam,
             p.tanggal_kembali
      FROM pengembalian pg
      LEFT JOIN peminjaman p ON pg.peminjaman_id = p.id
      LEFT JOIN users u ON p.peminjam_id = u.id
      LEFT JOIN alat a ON p.alat_id = a.id
      WHERE p.status = 'menunggu_konfirmasi' OR p.status = 'dikembalikan'
      ORDER BY pg.created_at DESC
    `);

    return NextResponse.json({ success: true, pengembalian: result.rows });
  } catch (error) {
    console.error('Error fetching pengembalian:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

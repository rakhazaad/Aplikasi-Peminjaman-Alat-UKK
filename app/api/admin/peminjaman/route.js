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

    const result = await pool.query(`
      SELECT p.*, 
             u.nama as peminjam_nama,
             a.nama as alat_nama
      FROM peminjaman p
      LEFT JOIN users u ON p.peminjam_id = u.id
      LEFT JOIN alat a ON p.alat_id = a.id
      ORDER BY p.created_at DESC
    `);

    return NextResponse.json({ success: true, peminjaman: result.rows });
  } catch (error) {
    console.error('Error fetching peminjaman:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { peminjam_id, alat_id, jumlah, tanggal_pinjam, tanggal_kembali, status, keterangan } = await request.json();

    if (!peminjam_id || !alat_id || !tanggal_pinjam || !tanggal_kembali) {
      return NextResponse.json(
        { success: false, message: 'Semua field wajib harus diisi' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'INSERT INTO peminjaman (peminjam_id, alat_id, jumlah, tanggal_pinjam, tanggal_kembali, status, keterangan) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [peminjam_id, alat_id, jumlah || 1, tanggal_pinjam, tanggal_kembali, status || 'pending', keterangan || null]
    );

    await pool.query(
      'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
      [decoded.id, 'CREATE', 'peminjaman', result.rows[0].id, 'Peminjaman baru']
    );

    return NextResponse.json({ success: true, peminjaman: result.rows[0] });
  } catch (error) {
    console.error('Error creating peminjaman:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

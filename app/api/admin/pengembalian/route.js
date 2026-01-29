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
      SELECT pg.*,
             CONCAT('ID: ', p.id, ' - ', u.nama, ' - ', a.nama) as peminjaman_info,
             p.status as peminjaman_status,
             p.tanggal_kembali
      FROM pengembalian pg
      LEFT JOIN peminjaman p ON pg.peminjaman_id = p.id
      LEFT JOIN users u ON p.peminjam_id = u.id
      LEFT JOIN alat a ON p.alat_id = a.id
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

    if (pool.ensureDendaColumn) {
      await pool.ensureDendaColumn();
    }

    const { peminjaman_id, tanggal_kembali_aktual, kondisi, keterangan, denda } = await request.json();

    if (!peminjaman_id || !tanggal_kembali_aktual) {
      return NextResponse.json(
        { success: false, message: 'Peminjaman dan tanggal kembali harus diisi' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'INSERT INTO pengembalian (peminjaman_id, tanggal_kembali_aktual, kondisi, keterangan, denda) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [peminjaman_id, tanggal_kembali_aktual, kondisi || 'baik', keterangan || null, denda ?? 0]
    );

    // Update status peminjaman
    await pool.query(
      'UPDATE peminjaman SET status = $1 WHERE id = $2',
      ['dikembalikan', peminjaman_id]
    );

    await pool.query(
      'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
      [decoded.id, 'CREATE', 'pengembalian', result.rows[0].id, 'Pengembalian baru']
    );

    return NextResponse.json({ success: true, pengembalian: result.rows[0] });
  } catch (error) {
    console.error('Error creating pengembalian:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

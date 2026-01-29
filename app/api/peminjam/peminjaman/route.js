import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createNotifikasiForPetugas, createNotifikasiForAdmin } from '@/lib/notifikasi';

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

    const result = await pool.query(`
      SELECT p.*,
             a.nama as alat_nama
      FROM peminjaman p
      LEFT JOIN alat a ON p.alat_id = a.id
      WHERE p.peminjam_id = $1
      ORDER BY p.created_at DESC
    `, [decoded.id]);

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
    if (!decoded || decoded.role !== 'peminjam') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { alat_id, jumlah, tanggal_pinjam, tanggal_kembali, keterangan } = await request.json();

    if (!alat_id || !tanggal_pinjam || !tanggal_kembali) {
      return NextResponse.json(
        { success: false, message: 'Semua field wajib harus diisi' },
        { status: 400 }
      );
    }

    // Check if equipment is available
    const alatResult = await pool.query('SELECT jumlah, status FROM alat WHERE id = $1', [alat_id]);
    if (alatResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Alat tidak ditemukan' },
        { status: 404 }
      );
    }

    const alat = alatResult.rows[0];
    if (alat.status !== 'tersedia' || alat.jumlah < jumlah) {
      return NextResponse.json(
        { success: false, message: 'Alat tidak tersedia atau jumlah tidak mencukupi' },
        { status: 400 }
      );
    }

    // Start transaction - create peminjaman and update alat jumlah
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert peminjaman
      const result = await client.query(
        'INSERT INTO peminjaman (peminjam_id, alat_id, jumlah, tanggal_pinjam, tanggal_kembali, status, keterangan) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [decoded.id, alat_id, jumlah, tanggal_pinjam, tanggal_kembali, 'pending', keterangan || null]
      );

      // Update jumlah alat (kurangi jumlah yang dipinjam)
      const newJumlah = alat.jumlah - jumlah;
      const newStatus = newJumlah === 0 ? 'dipinjam' : 'tersedia';
      
      await client.query(
        'UPDATE alat SET jumlah = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [newJumlah, newStatus, alat_id]
      );

      await client.query('COMMIT');
      client.release();

      // Get alat name and user name for notification
      const alatResult = await pool.query('SELECT nama FROM alat WHERE id = $1', [alat_id]);
      const userResult = await pool.query('SELECT nama FROM users WHERE id = $1', [decoded.id]);
      const alatNama = alatResult.rows[0]?.nama || 'Alat';
      const userName = userResult.rows[0]?.nama || 'Peminjam';

      // Notifikasi ke semua petugas
      await createNotifikasiForPetugas(
        'peminjaman_baru',
        'Pengajuan Peminjaman Baru',
        `${userName} mengajukan peminjaman alat "${alatNama}" (${jumlah} unit).`,
        '/petugas/approve'
      );

      // Notifikasi ke semua admin
      await createNotifikasiForAdmin(
        'peminjaman_baru',
        'Pengajuan Peminjaman Baru',
        `${userName} mengajukan peminjaman alat "${alatNama}" (${jumlah} unit).`,
        '/admin/peminjaman'
      );

      return NextResponse.json({ success: true, peminjaman: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating peminjaman:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

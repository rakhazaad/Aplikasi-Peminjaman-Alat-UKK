import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const { nama, kategori_id, deskripsi, jumlah, status } = await request.json();

    if (!nama || jumlah === undefined) {
      return NextResponse.json(
        { success: false, message: 'Nama dan jumlah harus diisi' },
        { status: 400 }
      );
    }

    // Otomatis update status berdasarkan jumlah
    // Jika jumlah > 0 dan status bukan 'rusak', maka status harus 'tersedia'
    // Jika jumlah = 0, status bisa 'dipinjam' atau sesuai input
    let finalStatus = status;
    if (jumlah > 0) {
      // Jika jumlah > 0, status harus 'tersedia' (kecuali status adalah 'rusak')
      if (status !== 'rusak') {
        finalStatus = 'tersedia';
      } else {
        // Jika status rusak tapi jumlah > 0, tetap rusak (tidak tersedia untuk dipinjam)
        finalStatus = 'rusak';
      }
    } else {
      // Jika jumlah = 0, status bisa 'dipinjam' atau sesuai input
      if (status === 'tersedia') {
        finalStatus = 'dipinjam'; // Jika jumlah 0, tidak bisa tersedia
      } else {
        finalStatus = status || 'dipinjam';
      }
    }

    const result = await pool.query(
      'UPDATE alat SET nama = $1, kategori_id = $2, deskripsi = $3, jumlah = $4, status = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [nama, kategori_id || null, deskripsi || null, jumlah, finalStatus, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Alat tidak ditemukan' },
        { status: 404 }
      );
    }

    await pool.query(
      'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
      [decoded.id, 'UPDATE', 'alat', id, `Update alat: ${nama}`]
    );

    return NextResponse.json({ success: true, alat: result.rows[0] });
  } catch (error) {
    console.error('Error updating alat:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    const result = await pool.query('DELETE FROM alat WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Alat tidak ditemukan' },
        { status: 404 }
      );
    }

    await pool.query(
      'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
      [decoded.id, 'DELETE', 'alat', id, 'Hapus alat']
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alat:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

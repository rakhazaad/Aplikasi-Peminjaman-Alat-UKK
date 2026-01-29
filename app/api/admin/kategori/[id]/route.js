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
    const { nama, deskripsi } = await request.json();

    if (!nama) {
      return NextResponse.json(
        { success: false, message: 'Nama harus diisi' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'UPDATE kategori SET nama = $1, deskripsi = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [nama, deskripsi || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Kategori tidak ditemukan' },
        { status: 404 }
      );
    }

    await pool.query(
      'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
      [decoded.id, 'UPDATE', 'kategori', id, `Update kategori: ${nama}`]
    );

    return NextResponse.json({ success: true, kategori: result.rows[0] });
  } catch (error) {
    console.error('Error updating kategori:', error);
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

    const result = await pool.query('DELETE FROM kategori WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Kategori tidak ditemukan' },
        { status: 404 }
      );
    }

    await pool.query(
      'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
      [decoded.id, 'DELETE', 'kategori', id, 'Hapus kategori']
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting kategori:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

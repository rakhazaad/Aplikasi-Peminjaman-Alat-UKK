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

    const result = await pool.query('SELECT * FROM kategori ORDER BY id');

    return NextResponse.json({ success: true, kategori: result.rows });
  } catch (error) {
    console.error('Error fetching kategori:', error);
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

    const { nama, deskripsi } = await request.json();

    if (!nama) {
      return NextResponse.json(
        { success: false, message: 'Nama harus diisi' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'INSERT INTO kategori (nama, deskripsi) VALUES ($1, $2) RETURNING *',
      [nama, deskripsi || null]
    );

    await pool.query(
      'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
      [decoded.id, 'CREATE', 'kategori', result.rows[0].id, `Kategori baru: ${nama}`]
    );

    return NextResponse.json({ success: true, kategori: result.rows[0] });
  } catch (error) {
    console.error('Error creating kategori:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

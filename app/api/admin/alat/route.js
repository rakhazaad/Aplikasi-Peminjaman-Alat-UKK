import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createNotifikasiForPeminjam } from '@/lib/notifikasi';

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
      SELECT a.*, k.nama as kategori_nama 
      FROM alat a 
      LEFT JOIN kategori k ON a.kategori_id = k.id 
      ORDER BY a.id
    `);

    return NextResponse.json({ success: true, alat: result.rows });
  } catch (error) {
    console.error('Error fetching alat:', error);
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
      'INSERT INTO alat (nama, kategori_id, deskripsi, jumlah, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nama, kategori_id || null, deskripsi || null, jumlah, finalStatus]
    );

    await pool.query(
      'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
      [decoded.id, 'CREATE', 'alat', result.rows[0].id, `Alat baru: ${nama}`]
    );

    // Notifikasi ke semua peminjam tentang alat baru
    await createNotifikasiForPeminjam(
      'alat_baru',
      'Alat Baru Tersedia',
      `Alat baru "${nama}" telah ditambahkan dan tersedia untuk dipinjam.`,
      '/peminjam/alat'
    );

    return NextResponse.json({ success: true, alat: result.rows[0] });
  } catch (error) {
    console.error('Error creating alat:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

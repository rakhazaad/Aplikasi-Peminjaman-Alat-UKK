import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request) {
  try {
    const { username, password, nama } = await request.json();

    if (!username || !password || !nama) {
      return NextResponse.json(
        { success: false, message: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    // Validasi panjang username dan password
    if (username.length < 3) {
      return NextResponse.json(
        { success: false, message: 'Username minimal 3 karakter' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Hanya bisa registrasi sebagai peminjam
    const role = 'peminjam';

    const result = await pool.query(
      'INSERT INTO users (username, password, nama, role) VALUES ($1, $2, $3, $4) RETURNING id, username, nama, role',
      [username, hashedPassword, nama, role]
    );

    return NextResponse.json({
      success: true,
      message: 'Registrasi berhasil',
      user: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, message: 'Username sudah digunakan' },
        { status: 400 }
      );
    }
    console.error('Error registering user:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan saat registrasi' },
      { status: 500 }
    );
  }
}
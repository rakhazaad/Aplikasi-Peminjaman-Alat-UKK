import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { hashPassword, verifyToken } from '@/lib/auth';

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

    const result = await pool.query(
      'SELECT id, username, nama, role, created_at FROM users ORDER BY id'
    );

    return NextResponse.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
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

    const { username, password, nama, role } = await request.json();

    if (!username || !password || !nama || !role) {
      return NextResponse.json(
        { success: false, message: 'Semua field harus diisi' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const result = await pool.query(
      'INSERT INTO users (username, password, nama, role) VALUES ($1, $2, $3, $4) RETURNING id, username, nama, role',
      [username, hashedPassword, nama, role]
    );

    // Log activity
    await pool.query(
      'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
      [decoded.id, 'CREATE', 'users', result.rows[0].id, `User baru: ${username}`]
    );

    return NextResponse.json({ success: true, user: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, message: 'Username sudah digunakan' },
        { status: 400 }
      );
    }
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

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
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Ensure schema
    if (pool.ensureSchema) {
      await pool.ensureSchema();
    }

    const result = await pool.query(
      'SELECT * FROM notifikasi WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [decoded.id]
    );

    const unreadCount = await pool.query(
      'SELECT COUNT(*) as count FROM notifikasi WHERE user_id = $1 AND dibaca = FALSE',
      [decoded.id]
    );

    return NextResponse.json({
      success: true,
      notifikasi: result.rows,
      unreadCount: parseInt(unreadCount.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching notifikasi:', error);
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
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Ensure schema
    if (pool.ensureSchema) {
      await pool.ensureSchema();
    }

    const { user_id, tipe, judul, pesan, link } = await request.json();

    if (!user_id || !tipe || !judul || !pesan) {
      return NextResponse.json(
        { success: false, message: 'Data tidak lengkap' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'INSERT INTO notifikasi (user_id, tipe, judul, pesan, link) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, tipe, judul, pesan, link || null]
    );

    return NextResponse.json({ success: true, notifikasi: result.rows[0] });
  } catch (error) {
    console.error('Error creating notifikasi:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

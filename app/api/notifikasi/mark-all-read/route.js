import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PUT(request) {
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

    await pool.query(
      'UPDATE notifikasi SET dibaca = TRUE WHERE user_id = $1 AND dibaca = FALSE',
      [decoded.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

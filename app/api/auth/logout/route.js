import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    
    // Log logout activity if token is valid
    if (token) {
      try {
        const decoded = verifyToken(token);
        if (decoded && decoded.id) {
          // Log logout activity
          await pool.query(
            'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
            [decoded.id, 'LOGOUT', 'auth', decoded.id, `Logout berhasil - Role: ${decoded.role}`]
          );
        }
      } catch (logError) {
        // Don't fail logout if logging fails
        console.error('Error logging logout activity:', logError);
      }
    }

    return NextResponse.json({ success: true, message: 'Logout berhasil' });
  } catch (error) {
    console.error('Logout API error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}

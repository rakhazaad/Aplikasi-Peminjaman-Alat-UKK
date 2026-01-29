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

    if (pool.ensureSchema) {
      await pool.ensureSchema();
    } else if (pool.ensureDendaColumn) {
      await pool.ensureDendaColumn();
    }

    // Get total denda from all pengembalian
    const result = await pool.query(
      'SELECT COALESCE(SUM(denda), 0) as total_denda FROM pengembalian WHERE denda > 0'
    );

    const totalDenda = parseFloat(result.rows[0].total_denda) || 0;

    return NextResponse.json({
      success: true,
      totalDenda: totalDenda,
    });
  } catch (error) {
    console.error('Error fetching total denda:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

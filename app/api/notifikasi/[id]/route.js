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
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Ensure schema
    if (pool.ensureSchema) {
      await pool.ensureSchema();
    }

    const { id } = params;
    const { dibaca } = await request.json();

    // Verify notification belongs to user
    const checkResult = await pool.query(
      'SELECT * FROM notifikasi WHERE id = $1 AND user_id = $2',
      [id, decoded.id]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Notifikasi tidak ditemukan' },
        { status: 404 }
      );
    }

    const result = await pool.query(
      'UPDATE notifikasi SET dibaca = $1 WHERE id = $2 RETURNING *',
      [dibaca !== undefined ? dibaca : true, id]
    );

    return NextResponse.json({ success: true, notifikasi: result.rows[0] });
  } catch (error) {
    console.error('Error updating notifikasi:', error);
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
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Ensure schema
    if (pool.ensureSchema) {
      await pool.ensureSchema();
    }

    const { id } = params;

    // Verify notification belongs to user
    const result = await pool.query(
      'DELETE FROM notifikasi WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, decoded.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Notifikasi tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting notifikasi:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

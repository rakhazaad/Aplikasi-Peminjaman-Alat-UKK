import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createNotifikasi } from '@/lib/notifikasi';

export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'petugas') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const { status } = await request.json();

    if (!status || !['disetujui', 'ditolak'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Status tidak valid' },
        { status: 400 }
      );
    }

    // Get peminjaman data first to check current status
    const peminjamanCheck = await pool.query('SELECT * FROM peminjaman WHERE id = $1', [id]);
    if (peminjamanCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Peminjaman tidak ditemukan' },
        { status: 404 }
      );
    }

    const peminjaman = peminjamanCheck.rows[0];
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update peminjaman status
      const result = await client.query(
        'UPDATE peminjaman SET status = $1, petugas_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
        [status, decoded.id, id]
      );

      // If rejected and was previously pending, return the jumlah to alat
      if (status === 'ditolak' && peminjaman.status === 'pending') {
        await client.query(
          'UPDATE alat SET jumlah = jumlah + $1, status = CASE WHEN jumlah + $1 > 0 THEN \'tersedia\' ELSE status END WHERE id = $2',
          [peminjaman.jumlah, peminjaman.alat_id]
        );
      }

      // If approved, update equipment status based on remaining jumlah
      if (status === 'disetujui') {
        const alatResult = await client.query('SELECT jumlah FROM alat WHERE id = $1', [peminjaman.alat_id]);
        if (alatResult.rows.length > 0) {
          const alat = alatResult.rows[0];
          const newStatus = alat.jumlah === 0 ? 'dipinjam' : 'tersedia';
          await client.query(
            'UPDATE alat SET status = $1 WHERE id = $2',
            [newStatus, peminjaman.alat_id]
          );
        }
      }

      await client.query('COMMIT');
      client.release();

      // Get alat name for notification
      const alatResult = await pool.query('SELECT nama FROM alat WHERE id = $1', [peminjaman.alat_id]);
      const alatNama = alatResult.rows[0]?.nama || 'Alat';

      // Notifikasi ke peminjam
      if (status === 'disetujui') {
        await createNotifikasi(
          peminjaman.peminjam_id,
          'peminjaman_disetujui',
          'Peminjaman Disetujui',
          `Peminjaman alat "${alatNama}" telah disetujui oleh petugas.`,
          '/peminjam/pinjam'
        );
      } else if (status === 'ditolak') {
        await createNotifikasi(
          peminjaman.peminjam_id,
          'peminjaman_ditolak',
          'Peminjaman Ditolak',
          `Peminjaman alat "${alatNama}" telah ditolak oleh petugas.`,
          '/peminjam/pinjam'
        );
      }

      return NextResponse.json({ success: true, peminjaman: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }

    return NextResponse.json({ success: true, peminjaman: result.rows[0] });
  } catch (error) {
    console.error('Error updating peminjaman:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

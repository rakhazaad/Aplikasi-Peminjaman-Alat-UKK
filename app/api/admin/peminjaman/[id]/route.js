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
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { peminjam_id, alat_id, jumlah, tanggal_pinjam, tanggal_kembali, status, keterangan } = body;

    // Check if this is an approve/reject request (only status provided)
    if (status && ['disetujui', 'ditolak'].includes(status) && !peminjam_id && !alat_id) {
      // This is an approve/reject request
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
          'UPDATE peminjaman SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
          [status, id]
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
            `Peminjaman alat "${alatNama}" telah disetujui oleh admin.`,
            '/peminjam/pinjam'
          );
        } else if (status === 'ditolak') {
          await createNotifikasi(
            peminjaman.peminjam_id,
            'peminjaman_ditolak',
            'Peminjaman Ditolak',
            `Peminjaman alat "${alatNama}" telah ditolak oleh admin.`,
            '/peminjam/pinjam'
          );
        }

        await pool.query(
          'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
          [decoded.id, 'UPDATE', 'peminjaman', id, `Admin ${status} peminjaman`]
        );

        return NextResponse.json({ success: true, peminjaman: result.rows[0] });
      } catch (error) {
        await client.query('ROLLBACK');
        client.release();
        throw error;
      }
    }

    // Regular update (full form update)
    if (!peminjam_id || !alat_id || !tanggal_pinjam || !tanggal_kembali) {
      return NextResponse.json(
        { success: false, message: 'Semua field wajib harus diisi' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'UPDATE peminjaman SET peminjam_id = $1, alat_id = $2, jumlah = $3, tanggal_pinjam = $4, tanggal_kembali = $5, status = $6, keterangan = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
      [peminjam_id, alat_id, jumlah, tanggal_pinjam, tanggal_kembali, status, keterangan || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Peminjaman tidak ditemukan' },
        { status: 404 }
      );
    }

    await pool.query(
      'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
      [decoded.id, 'UPDATE', 'peminjaman', id, 'Update peminjaman']
    );

    return NextResponse.json({ success: true, peminjaman: result.rows[0] });
  } catch (error) {
    console.error('Error updating peminjaman:', error);
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
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;

    const result = await pool.query('DELETE FROM peminjaman WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Peminjaman tidak ditemukan' },
        { status: 404 }
      );
    }

    await pool.query(
      'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
      [decoded.id, 'DELETE', 'peminjaman', id, 'Hapus peminjaman']
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting peminjaman:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

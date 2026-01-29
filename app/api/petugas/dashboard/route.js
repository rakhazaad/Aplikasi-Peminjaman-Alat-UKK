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
    if (!decoded || decoded.role !== 'petugas') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (pool.ensureSchema) {
      await pool.ensureSchema();
    }

    // Get total pending peminjaman
    const pendingPeminjamanCount = await pool.query(
      "SELECT COUNT(*) as count FROM peminjaman WHERE status = 'pending'"
    );

    // Get total pending pengembalian (menunggu_konfirmasi)
    const pendingPengembalianCount = await pool.query(`
      SELECT COUNT(*) as count 
      FROM peminjaman 
      WHERE status = 'menunggu_konfirmasi'
    `);

    // Get latest peminjaman (3 most recent)
    const latestPeminjaman = await pool.query(`
      SELECT 
        p.id,
        p.jumlah,
        p.tanggal_pinjam,
        p.tanggal_kembali,
        p.status,
        u.nama as peminjam_nama,
        a.nama as alat_nama
      FROM peminjaman p
      LEFT JOIN users u ON p.peminjam_id = u.id
      LEFT JOIN alat a ON p.alat_id = a.id
      ORDER BY p.id DESC
      LIMIT 3
    `);

    // Get latest pengembalian (3 most recent)
    const latestPengembalian = await pool.query(`
      SELECT 
        pg.id,
        pg.tanggal_kembali_aktual,
        pg.kondisi,
        pg.denda,
        pg.keterangan,
        p.id as peminjaman_id,
        p.status as peminjaman_status,
        u.nama as peminjam_nama,
        a.nama as alat_nama
      FROM pengembalian pg
      LEFT JOIN peminjaman p ON pg.peminjaman_id = p.id
      LEFT JOIN users u ON p.peminjam_id = u.id
      LEFT JOIN alat a ON p.alat_id = a.id
      ORDER BY pg.id DESC
      LIMIT 3
    `);

    // Get latest detail peminjaman (from laporan - 3 most recent)
    // Hanya menghitung jumlah yang baik (yang dikembalikan ke stok)
    // Alat yang rusak dan hilang tidak dihitung
    const latestDetailPeminjamanResult = await pool.query(`
      SELECT 
        p.id,
        p.jumlah as jumlah_original,
        p.tanggal_pinjam,
        p.status,
        pg.keterangan as pengembalian_keterangan,
        pg.kondisi as pengembalian_kondisi,
        u.nama as peminjam_nama,
        a.nama as alat_nama
      FROM peminjaman p
      LEFT JOIN users u ON p.peminjam_id = u.id
      LEFT JOIN alat a ON p.alat_id = a.id
      LEFT JOIN pengembalian pg ON pg.peminjaman_id = p.id AND p.status = 'dikembalikan'
      ORDER BY p.id DESC
      LIMIT 3
    `);

    // Process results to calculate jumlah based on pengembalian
    const latestDetailPeminjaman = latestDetailPeminjamanResult.rows.map(row => {
      let jumlah = row.jumlah_original;
      
      // Jika status dikembalikan, hitung hanya yang baik
      if (row.status === 'dikembalikan' && row.pengembalian_keterangan) {
        const detailMatch = row.pengembalian_keterangan.match(/\[Detail Kondisi: Baik: (\d+), Rusak: (\d+), Hilang: (\d+)\]/);
        if (detailMatch) {
          jumlah = parseInt(detailMatch[1]) || 0; // Hanya ambil yang baik
        } else if (row.pengembalian_kondisi === 'baik') {
          jumlah = row.jumlah_original; // Jika kondisi baik, semua dikembalikan
        } else {
          jumlah = 0; // Jika rusak atau hilang, tidak ada yang dikembalikan
        }
      }
      
      return {
        id: row.id,
        jumlah: jumlah,
        tanggal_pinjam: row.tanggal_pinjam,
        status: row.status,
        peminjam_nama: row.peminjam_nama,
        alat_nama: row.alat_nama,
      };
    });

    return NextResponse.json({
      success: true,
      statistics: {
        totalPendingPeminjaman: parseInt(pendingPeminjamanCount.rows[0].count, 10),
        totalPendingPengembalian: parseInt(pendingPengembalianCount.rows[0].count, 10),
      },
      latestPeminjaman: latestPeminjaman.rows,
      latestPengembalian: latestPengembalian.rows,
      latestDetailPeminjaman: latestDetailPeminjaman,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

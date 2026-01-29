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

    // Get summary
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_peminjaman,
        COUNT(*) FILTER (WHERE status = 'dikembalikan') as dikembalikan,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'ditolak') as ditolak
      FROM peminjaman
    `);

    // Get detail
    // Hanya menghitung jumlah yang baik (yang dikembalikan ke stok)
    // Alat yang rusak dan hilang tidak dihitung
    const detailResultRaw = await pool.query(`
      SELECT 
        p.id,
        p.jumlah as jumlah_original,
        p.tanggal_pinjam,
        p.tanggal_kembali,
        p.status,
        p.keterangan,
        pg.keterangan as pengembalian_keterangan,
        pg.kondisi as pengembalian_kondisi,
        pg.tanggal_kembali_aktual,
        pg.denda,
        u.nama as peminjam_nama,
        a.nama as alat_nama
      FROM peminjaman p
      LEFT JOIN users u ON p.peminjam_id = u.id
      LEFT JOIN alat a ON p.alat_id = a.id
      LEFT JOIN pengembalian pg ON pg.peminjaman_id = p.id AND p.status = 'dikembalikan'
      ORDER BY p.id DESC
      LIMIT 100
    `);

    // Process results to calculate jumlah based on pengembalian
    const detailResult = detailResultRaw.rows.map(row => {
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
        tanggal_kembali: row.tanggal_kembali,
        tanggal_kembali_aktual: row.tanggal_kembali_aktual,
        denda: row.denda || 0,
        status: row.status,
        keterangan: row.keterangan,
        peminjam_nama: row.peminjam_nama,
        alat_nama: row.alat_nama,
      };
    });

    return NextResponse.json({
      success: true,
      laporan: {
        ...summaryResult.rows[0],
        detail: detailResult,
      },
    });
  } catch (error) {
    console.error('Error fetching laporan:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

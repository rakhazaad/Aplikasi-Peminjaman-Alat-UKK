import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createNotifikasiForPetugas, createNotifikasiForAdmin } from '@/lib/notifikasi';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'peminjam') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    // Get pengembalian data with peminjaman info
    const result = await pool.query(`
      SELECT pg.*,
             p.status as peminjaman_status,
             a.nama as alat_nama,
             p.jumlah as peminjaman_jumlah
      FROM pengembalian pg
      LEFT JOIN peminjaman p ON pg.peminjaman_id = p.id
      LEFT JOIN alat a ON p.alat_id = a.id
      WHERE p.peminjam_id = $1
      ORDER BY pg.created_at DESC
    `, [decoded.id]);

    return NextResponse.json({ success: true, pengembalian: result.rows });
  } catch (error) {
    console.error('Error fetching pengembalian:', error);
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
    if (!decoded || decoded.role !== 'peminjam') {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
    }

    if (pool.ensureSchema) {
      await pool.ensureSchema();
    } else if (pool.ensureDendaColumn) {
      await pool.ensureDendaColumn();
    }

    const { peminjaman_id, tanggal_kembali_aktual, total_baik, total_rusak, total_hilang, keterangan } = await request.json();

    if (!peminjaman_id || !tanggal_kembali_aktual) {
      return NextResponse.json(
        { success: false, message: 'Peminjaman dan tanggal kembali harus diisi' },
        { status: 400 }
      );
    }

    // Verify peminjaman belongs to this user
    const peminjamanResult = await pool.query(
      'SELECT * FROM peminjaman WHERE id = $1 AND peminjam_id = $2',
      [peminjaman_id, decoded.id]
    );

    if (peminjamanResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Peminjaman tidak ditemukan' },
        { status: 404 }
      );
    }

    const peminjaman = peminjamanResult.rows[0];
    if (peminjaman.status !== 'disetujui' && peminjaman.status !== 'dipinjam') {
      return NextResponse.json(
        { success: false, message: 'Peminjaman tidak dapat dikembalikan' },
        { status: 400 }
      );
    }

    // Check if pengembalian already exists for this peminjaman
    const existingPengembalian = await pool.query(
      'SELECT * FROM pengembalian WHERE peminjaman_id = $1',
      [peminjaman_id]
    );

    if (existingPengembalian.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Pengembalian untuk peminjaman ini sudah diajukan' },
        { status: 400 }
      );
    }

    // Validasi total kondisi
    const totalKondisi = (total_baik || 0) + (total_rusak || 0) + (total_hilang || 0);
    if (totalKondisi !== peminjaman.jumlah) {
      return NextResponse.json(
        { success: false, message: `Total kondisi harus sama dengan jumlah yang dipinjam (${peminjaman.jumlah} unit)` },
        { status: 400 }
      );
    }

    if (totalKondisi === 0) {
      return NextResponse.json(
        { success: false, message: 'Minimal harus ada satu kondisi yang diisi' },
        { status: 400 }
      );
    }

    // Jika ada rusak atau hilang, keterangan wajib diisi
    if ((total_rusak > 0 || total_hilang > 0) && !keterangan) {
      return NextResponse.json(
        { success: false, message: 'Harap isi alasan kerusakan / kehilangan pada keterangan.' },
        { status: 400 }
      );
    }

    // Tentukan kondisi utama (untuk kompatibilitas dengan sistem lama)
    // Jika ada rusak atau hilang, gunakan kondisi yang lebih parah
    let kondisiUtama = 'baik';
    if (total_hilang > 0) {
      kondisiUtama = 'hilang';
    } else if (total_rusak > 0) {
      kondisiUtama = 'rusak';
    }

    // Simpan detail kondisi di keterangan sebagai JSON untuk referensi
    const detailKondisi = {
      total_baik: total_baik || 0,
      total_rusak: total_rusak || 0,
      total_hilang: total_hilang || 0,
    };
    const keteranganLengkap = keterangan 
      ? `${keterangan}\n\n[Detail Kondisi: Baik: ${detailKondisi.total_baik}, Rusak: ${detailKondisi.total_rusak}, Hilang: ${detailKondisi.total_hilang}]`
      : `[Detail Kondisi: Baik: ${detailKondisi.total_baik}, Rusak: ${detailKondisi.total_rusak}, Hilang: ${detailKondisi.total_hilang}]`;

    // Peminjam tidak menentukan denda. Denda di-set 0 dan akan diisi oleh petugas.
    const result = await pool.query(
      'INSERT INTO pengembalian (peminjaman_id, tanggal_kembali_aktual, kondisi, keterangan, denda) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [peminjaman_id, tanggal_kembali_aktual, kondisiUtama, keteranganLengkap, 0]
    );

    // Update peminjaman status menjadi menunggu_konfirmasi (tidak langsung dikembalikan)
    await pool.query(
      'UPDATE peminjaman SET status = $1 WHERE id = $2',
      ['menunggu_konfirmasi', peminjaman_id]
    );

    // Jangan update alat status dan jumlah dulu, tunggu konfirmasi petugas

    // Get alat name and user name for notification
    const alatResult = await pool.query('SELECT nama FROM alat WHERE id = $1', [peminjaman.alat_id]);
    const userResult = await pool.query('SELECT nama FROM users WHERE id = $1', [decoded.id]);
    const alatNama = alatResult.rows[0]?.nama || 'Alat';
    const userName = userResult.rows[0]?.nama || 'Peminjam';
    
    // Buat teks kondisi untuk notifikasi
    const kondisiParts = [];
    if (total_baik > 0) kondisiParts.push(`${total_baik} baik`);
    if (total_rusak > 0) kondisiParts.push(`${total_rusak} rusak`);
    if (total_hilang > 0) kondisiParts.push(`${total_hilang} hilang`);
    const kondisiText = kondisiParts.join(', ');

    // Notifikasi ke semua petugas
    await createNotifikasiForPetugas(
      'pengembalian_baru',
      'Pengajuan Pengembalian Baru',
      `${userName} mengajukan pengembalian alat "${alatNama}" (${kondisiText}).`,
      '/petugas/monitor'
    );

    // Notifikasi ke admin jika ada rusak/hilang
    if (total_rusak > 0 || total_hilang > 0) {
      await createNotifikasiForAdmin(
        'pengembalian_rusak_hilang',
        'Pengembalian dengan Kerusakan/Kehilangan',
        `${userName} mengajukan pengembalian alat "${alatNama}" dengan kondisi: ${kondisiText}.`,
        '/admin/pengembalian'
      );
    }

    return NextResponse.json({ success: true, pengembalian: result.rows[0] });
  } catch (error) {
    console.error('Error creating pengembalian:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}

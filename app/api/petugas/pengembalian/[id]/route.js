import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { createNotifikasi, createNotifikasiForAdmin } from '@/lib/notifikasi';

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

    if (pool.ensureSchema) {
      await pool.ensureSchema();
    } else if (pool.ensureDendaColumn) {
      await pool.ensureDendaColumn();
    }

    const { id } = params;
    const { denda, approve, alasan_denda, lunas } = await request.json();

    // Get pengembalian data with peminjaman info
    const pengembalianResult = await pool.query(
      `SELECT pg.*, p.peminjam_id, p.alat_id, p.jumlah, p.status 
       FROM pengembalian pg
       LEFT JOIN peminjaman p ON pg.peminjaman_id = p.id
       WHERE pg.id = $1`,
      [id]
    );

    if (pengembalianResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Pengembalian tidak ditemukan' },
        { status: 404 }
      );
    }

    const pengembalian = pengembalianResult.rows[0];
    const peminjaman = {
      id: pengembalian.peminjaman_id,
      peminjam_id: pengembalian.peminjam_id,
      alat_id: pengembalian.alat_id,
      jumlah: pengembalian.jumlah,
      status: pengembalian.status,
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // If approve is true, finalize the pengembalian
      if (approve === true) {
        // Check if peminjaman status is menunggu_konfirmasi
        if (peminjaman.status !== 'menunggu_konfirmasi') {
          await client.query('ROLLBACK');
          client.release();
          return NextResponse.json(
            { success: false, message: 'Pengembalian ini sudah dikonfirmasi atau tidak dalam status menunggu konfirmasi' },
            { status: 400 }
          );
        }

        // Validate denda if kondisi is rusak or hilang
        // Use provided denda or existing denda
        const finalDenda = denda !== undefined && denda !== null ? Number(denda) : (pengembalian.denda || 0);
        
        if ((pengembalian.kondisi === 'rusak' || pengembalian.kondisi === 'hilang') && 
            (finalDenda === undefined || finalDenda === null || Number.isNaN(finalDenda) || finalDenda <= 0)) {
          await client.query('ROLLBACK');
          client.release();
          return NextResponse.json(
            { success: false, message: 'Denda wajib diisi untuk kondisi rusak atau hilang sebelum konfirmasi' },
            { status: 400 }
          );
        }

        // Validate alasan denda if denda > 0
        if (finalDenda > 0 && (!alasan_denda || !alasan_denda.trim())) {
          // Check if alasan denda already exists in keterangan
          const existingAlasan = pengembalian.keterangan?.match(/\[Alasan Denda:\s*(.+?)\]/);
          if (!existingAlasan) {
            await client.query('ROLLBACK');
            client.release();
            return NextResponse.json(
              { success: false, message: 'Alasan denda wajib diisi jika denda lebih dari 0' },
              { status: 400 }
            );
          }
        }

        // Update keterangan dengan alasan denda jika ada
        let updatedKeterangan = pengembalian.keterangan || '';
        if (alasan_denda && alasan_denda.trim()) {
          // Remove existing alasan denda if exists
          updatedKeterangan = updatedKeterangan.replace(/\[Alasan Denda:\s*.*?\]/g, '').trim();
          // Add alasan denda to keterangan
          updatedKeterangan = updatedKeterangan 
            ? `${updatedKeterangan}\n\n[Alasan Denda: ${alasan_denda.trim()}]`
            : `[Alasan Denda: ${alasan_denda.trim()}]`;
        }

        await client.query(
          'UPDATE pengembalian SET denda = $1, petugas_id = $2, keterangan = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
          [finalDenda, decoded.id, updatedKeterangan, id]
        );

        // Parse detail kondisi dari keterangan
        let totalBaik = peminjaman.jumlah; // Default: semua baik (untuk kompatibilitas dengan data lama)
        let totalRusak = 0;
        let totalHilang = 0;

        // Coba parse detail kondisi dari keterangan
        if (pengembalian.keterangan) {
          const detailMatch = pengembalian.keterangan.match(/\[Detail Kondisi: Baik: (\d+), Rusak: (\d+), Hilang: (\d+)\]/);
          if (detailMatch) {
            totalBaik = parseInt(detailMatch[1]) || 0;
            totalRusak = parseInt(detailMatch[2]) || 0;
            totalHilang = parseInt(detailMatch[3]) || 0;
          } else {
            // Jika tidak ada detail, gunakan kondisi utama untuk menentukan
            // Jika kondisi utama adalah baik, semua baik
            // Jika rusak atau hilang, anggap semua rusak/hilang (tidak ada yang dikembalikan)
            if (pengembalian.kondisi === 'baik') {
              totalBaik = peminjaman.jumlah;
              totalRusak = 0;
              totalHilang = 0;
            } else if (pengembalian.kondisi === 'rusak') {
              totalBaik = 0;
              totalRusak = peminjaman.jumlah;
              totalHilang = 0;
            } else if (pengembalian.kondisi === 'hilang') {
              totalBaik = 0;
              totalRusak = 0;
              totalHilang = peminjaman.jumlah;
            }
          }
        }

        // Update peminjaman status to dikembalikan
        await client.query(
          'UPDATE peminjaman SET status = $1 WHERE id = $2',
          ['dikembalikan', peminjaman.id]
        );

        // Hanya kembalikan alat yang baik ke stok
        // Alat yang rusak dan hilang tidak dikembalikan (jumlah tidak bertambah)
        if (totalBaik > 0) {
          await client.query(
            'UPDATE alat SET status = CASE WHEN jumlah + $1 > 0 THEN \'tersedia\' ELSE status END, jumlah = jumlah + $1 WHERE id = $2',
            [totalBaik, peminjaman.alat_id]
          );
        }

        // Buat detail log
        const logDetail = `Approve pengembalian: ${totalBaik} baik dikembalikan, ${totalRusak} rusak, ${totalHilang} hilang. Denda: ${finalDenda}`;
        await client.query(
          'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
          [decoded.id, 'UPDATE', 'pengembalian', id, logDetail]
        );

        // Get alat name for notification
        const alatResult = await client.query('SELECT nama FROM alat WHERE id = $1', [peminjaman.alat_id]);
        const alatNama = alatResult.rows[0]?.nama || 'Alat';

        // Buat pesan notifikasi dengan detail kondisi
        let notifPesan = '';
        if (totalRusak > 0 || totalHilang > 0) {
          const kondisiParts = [];
          if (totalBaik > 0) kondisiParts.push(`${totalBaik} baik`);
          if (totalRusak > 0) kondisiParts.push(`${totalRusak} rusak`);
          if (totalHilang > 0) kondisiParts.push(`${totalHilang} hilang`);
          notifPesan = `Pengembalian alat "${alatNama}" telah dikonfirmasi. Kondisi: ${kondisiParts.join(', ')}.`;
          if (finalDenda > 0) {
            notifPesan += ` Anda dikenakan denda sebesar Rp ${Number(finalDenda).toLocaleString('id-ID')}.`;
          }
        } else {
          notifPesan = `Pengembalian alat "${alatNama}" telah dikonfirmasi oleh petugas.`;
          if (finalDenda > 0) {
            notifPesan = `Pengembalian alat "${alatNama}" telah dikonfirmasi. Anda dikenakan denda sebesar Rp ${Number(finalDenda).toLocaleString('id-ID')}.`;
          }
        }

        // Notifikasi ke peminjam
        if (finalDenda > 0 || totalRusak > 0 || totalHilang > 0) {
          await createNotifikasi(
            peminjaman.peminjam_id,
            'pengembalian_denda',
            'Pengembalian Dikonfirmasi',
            notifPesan,
            '/peminjam/kembali'
          );
        } else {
          await createNotifikasi(
            peminjaman.peminjam_id,
            'pengembalian_dikonfirmasi',
            'Pengembalian Dikonfirmasi',
            notifPesan,
            '/peminjam/kembali'
          );
        }

        // Notifikasi ke admin jika ada rusak/hilang
        if (totalRusak > 0 || totalHilang > 0) {
          const userResult = await client.query('SELECT nama FROM users WHERE id = $1', [peminjaman.peminjam_id]);
          const userName = userResult.rows[0]?.nama || 'Peminjam';
          
          const kondisiParts = [];
          if (totalRusak > 0) kondisiParts.push(`${totalRusak} rusak`);
          if (totalHilang > 0) kondisiParts.push(`${totalHilang} hilang`);
          
          await createNotifikasiForAdmin(
            'pengembalian_rusak_hilang',
            'Pengembalian dengan Kerusakan/Kehilangan',
            `${userName} mengembalikan alat "${alatNama}" dengan kondisi: ${kondisiParts.join(', ')}.`,
            '/admin/pengembalian'
          );
        }

        // Notifikasi ke admin jika ada denda
        if (finalDenda > 0) {
          const userResult = await client.query('SELECT nama FROM users WHERE id = $1', [peminjaman.peminjam_id]);
          const userName = userResult.rows[0]?.nama || 'Peminjam';
          
          await createNotifikasiForAdmin(
            'pengembalian_denda',
            'Peminjam Dikenakan Denda',
            `${userName} dikenakan denda sebesar Rp ${Number(finalDenda).toLocaleString('id-ID')} untuk pengembalian alat "${alatNama}".`,
            '/admin/pengembalian'
          );
        }
      } else if (lunas === true) {
        // Handle lunas (pembayaran denda) - hanya bisa dilakukan jika status sudah dikembalikan
        if (peminjaman.status !== 'dikembalikan') {
          await client.query('ROLLBACK');
          client.release();
          return NextResponse.json(
            { success: false, message: 'Pengembalian harus sudah dikonfirmasi sebelum menandai denda sebagai lunas' },
            { status: 400 }
          );
        }

        // Check if ada denda
        const finalDenda = pengembalian.denda || 0;
        if (finalDenda <= 0) {
          await client.query('ROLLBACK');
          client.release();
          return NextResponse.json(
            { success: false, message: 'Tidak ada denda yang perlu dilunasi' },
            { status: 400 }
          );
        }

        // Check if sudah lunas
        const alreadyLunas = /\[Status Pembayaran:\s*Lunas\]/i.test(pengembalian.keterangan || '');
        if (alreadyLunas) {
          await client.query('ROLLBACK');
          client.release();
          return NextResponse.json(
            { success: false, message: 'Denda sudah ditandai sebagai lunas' },
            { status: 400 }
          );
        }

        // Update keterangan dengan status pembayaran
        let updatedKeteranganLunas = pengembalian.keterangan || '';
        // Remove existing status pembayaran if exists
        updatedKeteranganLunas = updatedKeteranganLunas.replace(/\[Status Pembayaran:\s*.*?\]/g, '').trim();
        // Add status pembayaran to keterangan
        updatedKeteranganLunas = updatedKeteranganLunas 
          ? `${updatedKeteranganLunas}\n\n[Status Pembayaran: Lunas]`
          : `[Status Pembayaran: Lunas]`;

        await client.query(
          'UPDATE pengembalian SET keterangan = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [updatedKeteranganLunas, id]
        );

        await client.query(
          'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
          [decoded.id, 'UPDATE', 'pengembalian', id, 'Status pembayaran denda: Lunas']
        );

        // Notifikasi ke peminjam
        const alatResult = await client.query('SELECT nama FROM alat WHERE id = $1', [peminjaman.alat_id]);
        const alatNama = alatResult.rows[0]?.nama || 'Alat';
        
        await createNotifikasi(
          peminjaman.peminjam_id,
          'denda_lunas',
          'Denda Lunas',
          `Pembayaran denda untuk pengembalian alat "${alatNama}" telah dikonfirmasi sebagai lunas.`,
          '/peminjam/kembali'
        );
      } else {
        // Just update denda without approving
        if (denda === undefined || denda === null || Number.isNaN(Number(denda)) || Number(denda) < 0) {
          await client.query('ROLLBACK');
          client.release();
          return NextResponse.json(
            { success: false, message: 'Denda tidak valid' },
            { status: 400 }
          );
        }

        if (!alasan_denda || !alasan_denda.trim()) {
          await client.query('ROLLBACK');
          client.release();
          return NextResponse.json(
            { success: false, message: 'Alasan denda wajib diisi' },
            { status: 400 }
          );
        }

        const finalDenda = Number(denda);
        const oldDenda = pengembalian.denda || 0;

        // Update keterangan dengan alasan denda
        // Extract existing keterangan tanpa alasan denda jika ada
        let existingKeterangan = pengembalian.keterangan || '';
        // Remove existing alasan denda if exists
        existingKeterangan = existingKeterangan.replace(/\[Alasan Denda:\s*.*?\]/g, '').trim();
        
        // Add alasan denda to keterangan
        const updatedKeterangan = existingKeterangan 
          ? `${existingKeterangan}\n\n[Alasan Denda: ${alasan_denda.trim()}]`
          : `[Alasan Denda: ${alasan_denda.trim()}]`;

        await client.query(
          'UPDATE pengembalian SET denda = $1, keterangan = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          [finalDenda, updatedKeterangan, id]
        );

        await client.query(
          'INSERT INTO log_aktifitas (user_id, aksi, tabel, record_id, detail) VALUES ($1, $2, $3, $4, $5)',
          [decoded.id, 'UPDATE', 'pengembalian', id, `Set denda: ${denda}, Alasan: ${alasan_denda.trim()}`]
        );

        // Notifikasi ke admin jika denda baru di-set atau denda berubah
        if (finalDenda > 0 && finalDenda !== oldDenda) {
          const alatResult = await client.query('SELECT nama FROM alat WHERE id = $1', [peminjaman.alat_id]);
          const userResult = await client.query('SELECT nama FROM users WHERE id = $1', [peminjaman.peminjam_id]);
          const alatNama = alatResult.rows[0]?.nama || 'Alat';
          const userName = userResult.rows[0]?.nama || 'Peminjam';
          
          await createNotifikasiForAdmin(
            'pengembalian_denda',
            'Peminjam Dikenakan Denda',
            `${userName} dikenakan denda sebesar Rp ${Number(finalDenda).toLocaleString('id-ID')} untuk pengembalian alat "${alatNama}".`,
            '/admin/pengembalian'
          );
        }
      }

      await client.query('COMMIT');
      client.release();

      // Get updated pengembalian
      const result = await pool.query(
        'SELECT * FROM pengembalian WHERE id = $1',
        [id]
      );

      return NextResponse.json({ success: true, pengembalian: result.rows[0] });
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Error updating pengembalian:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan' },
      { status: 500 }
    );
  }
}


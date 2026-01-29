'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function MonitorPage() {
  const router = useRouter();
  const [pengembalian, setPengembalian] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDendaModal, setShowDendaModal] = useState(false);
  const [selectedPengembalian, setSelectedPengembalian] = useState(null);
  const [dendaForm, setDendaForm] = useState(0);
  const [alasanDenda, setAlasanDenda] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role !== 'petugas') {
        router.push('/');
        return;
      }
      setUser(payload);
      fetchPengembalian();
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchPengembalian = async () => {
    try {
      const response = await fetch('/api/petugas/pengembalian');
      const data = await response.json();
      if (data.success) {
        setPengembalian(data.pengembalian);
      }
    } catch (error) {
      console.error('Error fetching pengembalian:', error);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return 'Rp 0';
    return `Rp ${Number(value).toLocaleString('id-ID')}`;
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleDownloadBukti = (row) => {
    if (typeof window === 'undefined' || !row) return;

    const parseDetailKondisi = (keterangan) => {
      if (!keterangan) return null;
      const detailMatch = keterangan.match(/\[Detail Kondisi: Baik: (\d+), Rusak: (\d+), Hilang: (\d+)\]/);
      if (detailMatch) {
        return {
          baik: parseInt(detailMatch[1]) || 0,
          rusak: parseInt(detailMatch[2]) || 0,
          hilang: parseInt(detailMatch[3]) || 0,
        };
      }
      return null;
    };

    const detail = parseDetailKondisi(row.keterangan);

    const win = window.open('', '_blank', 'width=900,height=650');
    if (!win) return;

    const html = `
      <html>
        <head>
          <title>Bukti Pengembalian #${row.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; background: #f9fafb; }
            .card { max-width: 760px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; }
            .header { background: linear-gradient(90deg, #2563eb, #1d4ed8); color: #fff; padding: 20px 24px; }
            .header h1 { margin: 0; font-size: 20px; }
            .section { padding: 16px 24px; border-top: 1px solid #f3f4f6; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 14px; }
            .label { color: #6b7280; }
            .value { color: #111827; font-weight: 600; text-align: right; }
            .badge { display: inline-block; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
            .status-menunggu { background: #fef3c7; color: #b45309; }
            .status-dikembalikan { background: #d1fae5; color: #065f46; }
            .status-lain { background: #e5e7eb; color: #374151; }
            .chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end; }
            .chip { padding: 6px 10px; border-radius: 10px; font-size: 12px; font-weight: 700; }
            .chip-green { background: #d1fae5; color: #065f46; }
            .chip-red { background: #fee2e2; color: #b91c1c; }
            .chip-amber { background: #fef3c7; color: #b45309; }
            .footer { padding: 16px 24px 24px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="card">
            <div class="header">
              <h1>Bukti Pengembalian</h1>
              <div style="margin-top:8px; font-size:14px; color:#e0e7ff;">Nomor: #${row.id}</div>
            </div>
            <div class="section">
              <div class="row"><span class="label">Peminjam</span><span class="value">${row.peminjam_nama || '-'}</span></div>
              <div class="row"><span class="label">Alat</span><span class="value">${row.alat_nama || '-'}</span></div>
              <div class="row"><span class="label">ID Peminjaman</span><span class="value">#${row.peminjaman_id}</span></div>
              <div class="row"><span class="label">Jumlah</span><span class="value">${row.jumlah || '-'}</span></div>
            </div>
            <div class="section">
              <div class="row"><span class="label">Tanggal Kembali (rencana)</span><span class="value">${formatDate(row.tanggal_kembali)}</span></div>
              <div class="row"><span class="label">Tanggal Kembali Aktual</span><span class="value">${formatDate(row.tanggal_kembali_aktual)}</span></div>
              <div class="row"><span class="label">Status Pengembalian</span>
                <span class="value">
                  <span class="badge ${
                    row.peminjaman_status === 'menunggu_konfirmasi' ? 'status-menunggu' :
                    row.peminjaman_status === 'dikembalikan' ? 'status-dikembalikan' : 'status-lain'
                  }">
                    ${row.peminjaman_status === 'menunggu_konfirmasi' ? 'Menunggu Konfirmasi' : (row.peminjaman_status || '-')}
                  </span>
                </span>
              </div>
            </div>
            <div class="section">
              <div class="row"><span class="label">Kondisi</span>
                <span class="value">
                  ${detail ? `
                    <div class="chips">
                      ${detail.baik > 0 ? `<span class="chip chip-green">Baik: ${detail.baik}</span>` : ''}
                      ${detail.rusak > 0 ? `<span class="chip chip-red">Rusak: ${detail.rusak}</span>` : ''}
                      ${detail.hilang > 0 ? `<span class="chip chip-amber">Hilang: ${detail.hilang}</span>` : ''}
                    </div>
                  ` : `
                    <span class="badge status-lain">${row.kondisi || '-'}</span>
                  `}
                </span>
              </div>
              <div class="row"><span class="label">Denda</span><span class="value">${row.denda ? formatCurrency(row.denda) : 'Tidak ada'}</span></div>
              ${row.keterangan ? `<div class="row"><span class="label">Keterangan</span><span class="value" style="max-width:420px; text-align:right;">${row.keterangan}</span></div>` : ''}
            </div>
            <div class="footer">
              Dicetak otomatis dari sistem peminjaman. Simpan sebagai PDF untuk arsip.
            </div>
          </div>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  const openDendaModal = (p) => {
    setSelectedPengembalian(p);
    setDendaForm(p.denda || 0);
    // Extract existing alasan denda from keterangan if exists
    const alasanMatch = p.keterangan?.match(/\[Alasan Denda:\s*(.+?)\]/);
    setAlasanDenda(alasanMatch ? alasanMatch[1] : '');
    setShowDendaModal(true);
  };

  const handleSaveDenda = async (e) => {
    e.preventDefault();
    if (!selectedPengembalian) return;

    // Validate alasan denda if denda > 0
    if (dendaForm > 0 && (!alasanDenda || !alasanDenda.trim())) {
      alert('Alasan denda wajib diisi jika denda lebih dari 0');
      return;
    }

    try {
      const response = await fetch(`/api/petugas/pengembalian/${selectedPengembalian.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          denda: dendaForm, 
          approve: false,
          alasan_denda: alasanDenda.trim() || null
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowDendaModal(false);
        setSelectedPengembalian(null);
        setAlasanDenda('');
        fetchPengembalian();
        alert('Denda berhasil disimpan');
      } else {
        alert(data.message || 'Terjadi kesalahan saat menyimpan denda');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menyimpan denda');
    }
  };

  // Check if denda sudah lunas
  const isDendaLunas = (keterangan) => {
    if (!keterangan) return false;
    return /\[Status Pembayaran:\s*Lunas\]/i.test(keterangan);
  };

  const handleLunas = async (p) => {
    if (!confirm('Konfirmasi bahwa denda sudah dibayar lunas?')) return;

    try {
      const response = await fetch(`/api/petugas/pengembalian/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lunas: true }),
      });

      const data = await response.json();
      if (data.success) {
        fetchPengembalian();
        alert('Status pembayaran denda berhasil diupdate menjadi lunas');
      } else {
        alert(data.message || 'Terjadi kesalahan');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handleApprove = async (p) => {
    // Parse detail kondisi untuk validasi denda
    const parseDetailKondisi = (keterangan) => {
      if (!keterangan) return null;
      const detailMatch = keterangan.match(/\[Detail Kondisi: Baik: (\d+), Rusak: (\d+), Hilang: (\d+)\]/);
      if (detailMatch) {
        return {
          baik: parseInt(detailMatch[1]) || 0,
          rusak: parseInt(detailMatch[2]) || 0,
          hilang: parseInt(detailMatch[3]) || 0,
        };
      }
      return null;
    };
    const detailKondisi = parseDetailKondisi(p.keterangan);
    const hasRusakOrHilang = detailKondisi 
      ? (detailKondisi.rusak > 0 || detailKondisi.hilang > 0)
      : (p.kondisi === 'rusak' || p.kondisi === 'hilang');
    
    // Check if denda is required but not set
    if (hasRusakOrHilang && (!p.denda || p.denda <= 0)) {
      alert('Denda wajib diisi untuk kondisi rusak atau hilang sebelum konfirmasi. Silakan tetapkan denda terlebih dahulu.');
      return;
    }

    const dendaText = hasRusakOrHilang ? `\nDenda: Rp ${Number(p.denda || 0).toLocaleString('id-ID')}` : '';
    if (!confirm(`Apakah Anda yakin ingin mengkonfirmasi pengembalian ini?${dendaText}`)) {
      return;
    }

    try {
      const denda = p.denda || 0;
      const response = await fetch(`/api/petugas/pengembalian/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ denda: denda, approve: true }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Pengembalian berhasil dikonfirmasi');
        fetchPengembalian();
      } else {
        alert(data.message || 'Terjadi kesalahan saat mengkonfirmasi pengembalian');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat mengkonfirmasi pengembalian');
    }
  };

  // Filter pengembalian berdasarkan search query
  const filteredPengembalian = useMemo(() => {
    if (!searchQuery.trim()) return pengembalian;
    const query = searchQuery.toLowerCase();
    return pengembalian.filter(p => 
      p.peminjam_nama?.toLowerCase().includes(query) ||
      p.alat_nama?.toLowerCase().includes(query) ||
      p.id.toString().includes(query) ||
      p.peminjaman_id?.toString().includes(query) ||
      p.kondisi?.toLowerCase().includes(query) ||
      p.peminjaman_status?.toLowerCase().includes(query) ||
      p.tanggal_pinjam?.toLowerCase().includes(query)
    );
  }, [pengembalian, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredPengembalian.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPengembalian = filteredPengembalian.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar user={user} />
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        <Header user={user} title="Pantau Pengembalian" />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Pantau Pengembalian</h1>
              <p className="text-gray-600">Kelola dan konfirmasi pengembalian alat</p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari berdasarkan ID, nama peminjam, nama alat, kondisi, atau status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pl-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all bg-white text-gray-900 placeholder-gray-400"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <span className="mr-2">↩️</span>
                  Daftar Pengembalian
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Peminjaman</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Peminjam</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alat</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tgl Kembali</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tgl Kembali Aktual</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kondisi</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status Peminjaman</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Denda</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedPengembalian.length === 0 ? (
                      <tr>
                        <td colSpan="10" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-4xl mb-2">📦</span>
                            <p className="text-sm text-gray-500">
                              {searchQuery ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada pengembalian yang perlu dikonfirmasi'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                    paginatedPengembalian.map((p) => {
                      // Parse detail kondisi dari keterangan
                      const parseDetailKondisi = (keterangan) => {
                        if (!keterangan) return null;
                        // Format: [Detail Kondisi: Baik: X, Rusak: Y, Hilang: Z]
                        const detailMatch = keterangan.match(/\[Detail Kondisi: Baik: (\d+), Rusak: (\d+), Hilang: (\d+)\]/);
                        if (detailMatch) {
                          return {
                            baik: parseInt(detailMatch[1]) || 0,
                            rusak: parseInt(detailMatch[2]) || 0,
                            hilang: parseInt(detailMatch[3]) || 0,
                          };
                        }
                        return null;
                      };
                      const detailKondisi = parseDetailKondisi(p.keterangan);
                      // Check if terlambat (tanggal_kembali_aktual > tanggal_kembali)
                      const isTelat = p.tanggal_kembali && p.tanggal_kembali_aktual && 
                        new Date(p.tanggal_kembali_aktual) > new Date(p.tanggal_kembali);
                      return (
                        <tr key={p.id} className={`hover:bg-blue-50/50 transition-colors ${isTelat ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">ID: {p.peminjaman_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.peminjam_nama}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.alat_nama}</td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isTelat ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                            {p.tanggal_kembali ? new Date(p.tanggal_kembali).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            {isTelat && <span className="ml-2 text-xs text-red-600">⚠️ Telat</span>}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isTelat ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                            {p.tanggal_kembali_aktual ? new Date(p.tanggal_kembali_aktual).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {detailKondisi ? (
                              <div className="flex flex-wrap gap-1.5">
                                {detailKondisi.baik > 0 && (
                                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                    Baik: {detailKondisi.baik}
                                  </span>
                                )}
                                {detailKondisi.rusak > 0 && (
                                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                    Rusak: {detailKondisi.rusak}
                                  </span>
                                )}
                                {detailKondisi.hilang > 0 && (
                                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                    Hilang: {detailKondisi.hilang}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                p.kondisi === 'baik' ? 'bg-green-100 text-green-800' :
                                p.kondisi === 'rusak' ? 'bg-red-100 text-red-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {p.kondisi}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                              p.peminjaman_status === 'menunggu_konfirmasi' ? 'bg-amber-100 text-amber-800' :
                              p.peminjaman_status === 'dikembalikan' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {p.peminjaman_status === 'menunggu_konfirmasi' ? 'Menunggu Konfirmasi' : p.peminjaman_status || '-'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                            {p.denda ? (
                              <span className="text-red-600">Rp {Number(p.denda).toLocaleString('id-ID')}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex flex-col gap-2 items-start">
                              <div className="flex gap-2 flex-wrap">
                                {p.peminjaman_status === 'menunggu_konfirmasi' ? (
                                  <>
                                    <button
                                      onClick={() => openDendaModal(p)}
                                      className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-xs"
                                    >
                                      {p.denda ? '💰 Edit Denda' : '💰 Set Denda'}
                                    </button>
                                    <button
                                      onClick={() => handleApprove(p)}
                                      className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-xs"
                                    >
                                      ✓ Konfirmasi
                                    </button>
                                  </>
                                ) : p.peminjaman_status === 'dikembalikan' && p.denda && p.denda > 0 && !isDendaLunas(p.keterangan) ? (
                                  <button
                                    onClick={() => handleLunas(p)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-xs"
                                  >
                                    💳 Lunaskan
                                  </button>
                                ) : p.peminjaman_status === 'dikembalikan' && p.denda && p.denda > 0 && isDendaLunas(p.keterangan) ? (
                                  <span className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">✓ Lunas</span>
                                ) : (
                                  <span className="text-gray-400 text-xs">Sudah dikonfirmasi</span>
                                )}
                              </div>
                              <button
                                onClick={() => handleDownloadBukti(p)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-xs"
                              >
                                🖨️ Unduh Bukti
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {filteredPengembalian.length > 0 && (
              <div className="mt-6 px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
                <div className="text-sm text-gray-600 font-medium">
                  Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredPengembalian.length)} dari {filteredPengembalian.length} data
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                    }`}
                  >
                    Sebelumnya
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700 font-medium">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      currentPage === totalPages
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                    }`}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}

          {showDendaModal && selectedPengembalian && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 rounded-t-2xl">
                  <h2 className="text-2xl font-bold text-white">Atur Denda</h2>
                </div>
                <div className="p-6">
                  <div className="mb-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Peminjam:</span> {selectedPengembalian.peminjam_nama}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Alat:</span> {selectedPengembalian.alat_nama}
                    </p>
                    {(() => {
                      const parseDetailKondisi = (keterangan) => {
                        if (!keterangan) return null;
                        const detailMatch = keterangan.match(/\[Detail Kondisi: Baik: (\d+), Rusak: (\d+), Hilang: (\d+)\]/);
                        if (detailMatch) {
                          return {
                            baik: parseInt(detailMatch[1]) || 0,
                            rusak: parseInt(detailMatch[2]) || 0,
                            hilang: parseInt(detailMatch[3]) || 0,
                          };
                        }
                        return null;
                      };
                      const detailKondisi = parseDetailKondisi(selectedPengembalian.keterangan);
                      if (detailKondisi) {
                        return (
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">Kondisi:</span>{' '}
                            {detailKondisi.baik > 0 && <span className="text-green-600">Baik: {detailKondisi.baik}</span>}
                            {detailKondisi.rusak > 0 && <span className="text-red-600 ml-2">Rusak: {detailKondisi.rusak}</span>}
                            {detailKondisi.hilang > 0 && <span className="text-amber-600 ml-2">Hilang: {detailKondisi.hilang}</span>}
                          </p>
                        );
                      }
                      return (
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Kondisi:</span>{' '}
                          <span className="capitalize">{selectedPengembalian.kondisi}</span>
                        </p>
                      );
                    })()}
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Denda Saat Ini:</span>{' '}
                      {selectedPengembalian.denda ? `Rp ${Number(selectedPengembalian.denda).toLocaleString('id-ID')}` : 'Tidak ada'}
                    </p>
                  </div>
                  <form onSubmit={handleSaveDenda} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Total Denda (Rp)</label>
                      <input
                        type="number"
                        value={dendaForm}
                        onChange={(e) => setDendaForm(Number(e.target.value) || 0)}
                        min="0"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Tentukan total denda berdasarkan kondisi alat dan alasan dari peminjam.
                        {selectedPengembalian?.kondisi === 'rusak' || selectedPengembalian?.kondisi === 'hilang' ? 
                          ' Denda wajib diisi sebelum konfirmasi.' : ''}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Alasan Denda {dendaForm > 0 && <span className="text-red-500">*</span>}
                      </label>
                      <textarea
                        value={alasanDenda}
                        onChange={(e) => setAlasanDenda(e.target.value)}
                        placeholder="Masukkan alasan kenapa peminjam dikenakan denda..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                        rows="4"
                        required={dendaForm > 0}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {dendaForm > 0 
                          ? 'Alasan denda wajib diisi untuk menjelaskan kenapa peminjam dikenakan denda.'
                          : 'Alasan denda akan wajib diisi jika denda lebih dari 0.'}
                      </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                      >
                        Simpan Denda
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDendaModal(false);
                          setSelectedPengembalian(null);
                          setAlasanDenda('');
                        }}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}

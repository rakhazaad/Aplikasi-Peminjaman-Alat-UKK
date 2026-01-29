'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function PengembalianPage() {
  const router = useRouter();
  const [pengembalian, setPengembalian] = useState([]);
  const [peminjaman, setPeminjaman] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPengembalian, setEditingPengembalian] = useState(null);
  const [showDendaModal, setShowDendaModal] = useState(false);
  const [selectedPengembalian, setSelectedPengembalian] = useState(null);
  const [dendaForm, setDendaForm] = useState(0);
  const [alasanDenda, setAlasanDenda] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    peminjaman_id: '',
    tanggal_kembali_aktual: '',
    kondisi: 'baik',
    keterangan: '',
    denda: 0,
  });

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
      if (payload.role !== 'admin') {
        router.push('/');
        return;
      }
      setUser(payload);
      fetchPengembalian();
      fetchPeminjaman();
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchPengembalian = async () => {
    try {
      const response = await fetch('/api/admin/pengembalian');
      const data = await response.json();
      if (data.success) {
        setPengembalian(data.pengembalian);
      }
    } catch (error) {
      console.error('Error fetching pengembalian:', error);
    }
  };

  const fetchPeminjaman = async () => {
    try {
      const response = await fetch('/api/admin/peminjaman');
      const data = await response.json();
      if (data.success) {
        setPeminjaman(data.peminjaman);
      }
    } catch (error) {
      console.error('Error fetching peminjaman:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPengembalian
        ? `/api/admin/pengembalian/${editingPengembalian.id}`
        : '/api/admin/pengembalian';
      const method = editingPengembalian ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        setEditingPengembalian(null);
        setFormData({
          peminjaman_id: '',
          tanggal_kembali_aktual: '',
          kondisi: 'baik',
          keterangan: '',
          denda: 0,
        });
        fetchPengembalian();
      } else {
        alert(data.message || 'Terjadi kesalahan');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handleEdit = (p) => {
    setEditingPengembalian(p);
    setFormData({
      peminjaman_id: p.peminjaman_id,
      tanggal_kembali_aktual: p.tanggal_kembali_aktual,
      kondisi: p.kondisi,
      keterangan: p.keterangan || '',
      denda: p.denda || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus data pengembalian ini?')) return;

    try {
      const response = await fetch(`/api/admin/pengembalian/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchPengembalian();
        setSelectedItems([]);
      } else {
        alert(data.message || 'Terjadi kesalahan');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(paginatedPengembalian.map(p => p.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      alert('Pilih data yang ingin dihapus terlebih dahulu');
      return;
    }

    if (!confirm(`Yakin ingin menghapus ${selectedItems.length} data pengembalian yang dipilih?`)) return;

    try {
      const deletePromises = selectedItems.map(id => 
        fetch(`/api/admin/pengembalian/${id}`, { method: 'DELETE' })
      );
      
      const results = await Promise.all(deletePromises);
      const dataResults = await Promise.all(results.map(r => r.json()));
      
      const allSuccess = dataResults.every(r => r.success);
      
      if (allSuccess) {
        fetchPengembalian();
        setSelectedItems([]);
        alert(`${selectedItems.length} data berhasil dihapus`);
      } else {
        alert('Beberapa data gagal dihapus');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menghapus data');
    }
  };

  const openDendaModal = (p) => {
    setSelectedPengembalian(p);
    setDendaForm(p.denda || 0);
    // Extract alasan denda dari keterangan jika ada
    const alasanMatch = p.keterangan?.match(/\[Alasan Denda:\s*(.+?)\]/);
    setAlasanDenda(alasanMatch ? alasanMatch[1] : '');
    setShowDendaModal(true);
  };

  const handleSaveDenda = async (e) => {
    e.preventDefault();
    if (!selectedPengembalian) return;

    if (!alasanDenda.trim()) {
      alert('Alasan denda wajib diisi');
      return;
    }

    try {
      const response = await fetch(`/api/admin/pengembalian/${selectedPengembalian.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          denda: dendaForm, 
          approve: false,
          alasan_denda: alasanDenda.trim()
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

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatCurrency = (value) => {
    if (!value) return 'Rp 0';
    return `Rp ${Number(value).toLocaleString('id-ID')}`;
  };

  const handleDownloadBukti = (p) => {
    if (typeof window === 'undefined' || !p) return;

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

    const parts = (p.peminjaman_info || '').split(' - ');
    const peminjamNama = parts[1] || '-';
    const alatNama = parts[2] || '-';
    const detail = parseDetailKondisi(p.keterangan);

    const win = window.open('', '_blank', 'width=900,height=650');
    if (!win) return;

    const html = `
      <html>
        <head>
          <title>Bukti Pengembalian #${p.id}</title>
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
              <div style="margin-top:8px; font-size:14px; color:#e0e7ff;">Nomor: #${p.id}</div>
            </div>
            <div class="section">
              <div class="row"><span class="label">Peminjam</span><span class="value">${peminjamNama}</span></div>
              <div class="row"><span class="label">Alat</span><span class="value">${alatNama}</span></div>
              <div class="row"><span class="label">ID Peminjaman</span><span class="value">#${p.peminjaman_id || '-'}</span></div>
            </div>
            <div class="section">
              <div class="row"><span class="label">Tanggal Kembali (rencana)</span><span class="value">${formatDate(p.tanggal_kembali)}</span></div>
              <div class="row"><span class="label">Tanggal Kembali Aktual</span><span class="value">${formatDate(p.tanggal_kembali_aktual)}</span></div>
              <div class="row"><span class="label">Status Pengembalian</span>
                <span class="value">
                  <span class="badge ${
                    p.peminjaman_status === 'menunggu_konfirmasi' ? 'status-menunggu' :
                    p.peminjaman_status === 'dikembalikan' ? 'status-dikembalikan' : 'status-lain'
                  }">
                    ${p.peminjaman_status === 'menunggu_konfirmasi' ? 'Menunggu Konfirmasi' : (p.peminjaman_status || '-')}
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
                    <span class="badge status-lain">${p.kondisi || '-'}</span>
                  `}
                </span>
              </div>
              <div class="row"><span class="label">Denda</span><span class="value">${p.denda ? formatCurrency(p.denda) : 'Tidak ada'}</span></div>
              ${p.keterangan ? `<div class="row"><span class="label">Keterangan</span><span class="value" style="max-width:420px; text-align:right;">${p.keterangan}</span></div>` : ''}
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

  // Check if denda sudah lunas
  const isDendaLunas = (keterangan) => {
    if (!keterangan) return false;
    return /\[Status Pembayaran:\s*Lunas\]/i.test(keterangan);
  };

  const handleLunas = async (p) => {
    if (!confirm('Konfirmasi bahwa denda sudah dibayar lunas?')) return;

    try {
      const response = await fetch(`/api/admin/pengembalian/${p.id}`, {
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
      const response = await fetch(`/api/admin/pengembalian/${p.id}`, {
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
      p.peminjaman_info?.toLowerCase().includes(query) ||
      p.kondisi?.toLowerCase().includes(query) ||
      p.id.toString().includes(query) ||
      p.peminjaman_id?.toString().includes(query)
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
    setSelectedItems([]);
  }, [searchQuery]);

  // Reset selected items when page changes
  useEffect(() => {
    setSelectedItems([]);
  }, [currentPage]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar user={user} />
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        <Header user={user} title="CRUD Pengembalian" />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">CRUD Pengembalian</h1>
                <p className="text-gray-600">Kelola data pengembalian alat</p>
              </div>
              <button
                onClick={() => {
                  setEditingPengembalian(null);
                  setFormData({
                    peminjaman_id: '',
                    tanggal_kembali_aktual: '',
                    kondisi: 'baik',
                    keterangan: '',
                  });
                  setShowModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                + Tambah Pengembalian
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari berdasarkan ID, info peminjaman, atau kondisi..."
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
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <span className="mr-2">↩️</span>
                  Daftar Pengembalian
                </h2>
                {selectedItems.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-sm"
                  >
                    🗑️ Hapus {selectedItems.length} Data
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                        <input
                          type="checkbox"
                          checked={paginatedPengembalian.length > 0 && selectedItems.length === paginatedPengembalian.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Peminjaman</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tgl Kembali</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tgl Kembali Aktual</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kondisi</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Denda</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alasan Denda</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedPengembalian.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-4xl mb-2">📦</span>
                            <p className="text-sm text-gray-500">
                              {searchQuery ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data pengembalian'}
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
                        const rowClassName = isTelat 
                          ? 'bg-red-50 hover:bg-red-100' 
                          : selectedItems.includes(p.id) 
                            ? 'bg-blue-50 hover:bg-blue-50/50' 
                            : 'hover:bg-blue-50/50';
                        return (
                          <tr key={p.id} className={`transition-colors ${rowClassName}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(p.id)}
                                onChange={() => handleSelectItem(p.id)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ID: {p.peminjaman_id} - {p.peminjaman_info}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isTelat ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                              {p.tanggal_kembali ? new Date(p.tanggal_kembali).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                              {isTelat && <span className="ml-2 text-xs text-red-600">⚠️ Telat</span>}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isTelat ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                              {p.tanggal_kembali_aktual ? new Date(p.tanggal_kembali_aktual).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {detailKondisi ? (
                                <div className="flex flex-wrap gap-1">
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
                                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                      Hilang: {detailKondisi.hilang}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize ${
                                  p.kondisi === 'baik' ? 'bg-green-100 text-green-800' :
                                  p.kondisi === 'rusak' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {p.kondisi}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                              {p.denda ? `Rp ${Number(p.denda).toLocaleString('id-ID')}` : '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                              {(() => {
                                const alasanMatch = p.keterangan?.match(/\[Alasan Denda:\s*(.+?)\]/);
                                return alasanMatch ? (
                                  <span className="text-xs" title={alasanMatch[1]}>
                                    {alasanMatch[1].length > 50 ? `${alasanMatch[1].substring(0, 50)}...` : alasanMatch[1]}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                );
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex gap-2 flex-wrap">
                                <button
                                  onClick={() => handleDownloadBukti(p)}
                                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-xs"
                                >
                                  🖨️ Cetak Bukti
                                </button>
                                {p.peminjaman_status === 'menunggu_konfirmasi' ? (
                                  <>
                                    <button
                                      onClick={() => openDendaModal(p)}
                                      className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-xs"
                                    >
                                      💰 {p.denda ? 'Edit Denda' : 'Set Denda'}
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
                                  <>
                                    <button
                                      onClick={() => openDendaModal(p)}
                                      className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-xs"
                                    >
                                      💰 {p.denda ? 'Edit Denda' : 'Set Denda'}
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => handleEdit(p)}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-xs"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(p.id)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-xs"
                                >
                                  🗑️ Hapus
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

          {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-2xl sticky top-0">
                  <h2 className="text-2xl font-bold text-white">
                    {editingPengembalian ? 'Edit Pengembalian' : 'Tambah Pengembalian'}
                  </h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Peminjaman</label>
                    <select
                      value={formData.peminjaman_id}
                      onChange={(e) => setFormData({ ...formData, peminjaman_id: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Pilih Peminjaman</option>
                      {peminjaman.map((p) => (
                        <option key={p.id} value={p.id}>
                          ID: {p.id} - {p.peminjam_nama} - {p.alat_nama}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Kembali Aktual</label>
                    <input
                      type="date"
                      value={formData.tanggal_kembali_aktual}
                      onChange={(e) => setFormData({ ...formData, tanggal_kembali_aktual: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Kondisi</label>
                    <select
                      value={formData.kondisi}
                      onChange={(e) => setFormData({ ...formData, kondisi: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="baik">Baik</option>
                      <option value="rusak">Rusak</option>
                      <option value="hilang">Hilang</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Keterangan</label>
                    <textarea
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Denda (Rp)</label>
                    <input
                      type="number"
                      value={formData.denda}
                      onChange={(e) =>
                        setFormData({ ...formData, denda: Number(e.target.value) || 0 })
                      }
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Isi denda jika kondisi alat <span className="font-semibold">rusak</span> atau{' '}
                      <span className="font-semibold">hilang</span>.
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                    >
                      Simpan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingPengembalian(null);
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition-all duration-200 font-semibold"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Edit Denda */}
          {showDendaModal && selectedPengembalian && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 rounded-t-2xl">
                  <h2 className="text-2xl font-bold text-white">Atur Denda</h2>
                </div>
                <div className="p-6">
                  <div className="mb-4 space-y-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Peminjam:</span> {selectedPengembalian.peminjaman_info?.split(' - ')[1] || '-'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Alat:</span> {selectedPengembalian.peminjaman_info?.split(' - ')[2] || '-'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Kondisi:</span>{' '}
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
                          const parts = [];
                          if (detailKondisi.baik > 0) parts.push(`${detailKondisi.baik} baik`);
                          if (detailKondisi.rusak > 0) parts.push(`${detailKondisi.rusak} rusak`);
                          if (detailKondisi.hilang > 0) parts.push(`${detailKondisi.hilang} hilang`);
                          return parts.join(', ');
                        }
                        return selectedPengembalian.kondisi || '-';
                      })()}
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
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Alasan Denda <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={alasanDenda}
                        onChange={(e) => setAlasanDenda(e.target.value)}
                        placeholder="Masukkan alasan kenapa peminjam dikenakan denda..."
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                        rows="4"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Alasan denda wajib diisi untuk menjelaskan kenapa peminjam dikenakan denda.
                      </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-xl hover:from-amber-700 hover:to-amber-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                      >
                        Simpan
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

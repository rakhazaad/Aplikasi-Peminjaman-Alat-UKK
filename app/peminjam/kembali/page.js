'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function KembaliPage() {
  const router = useRouter();
  const [peminjaman, setPeminjaman] = useState([]);
  const [pengembalian, setPengembalian] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPeminjaman, setSelectedPeminjaman] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [formData, setFormData] = useState({
    tanggal_kembali_aktual: '',
    total_baik: 0,
    total_rusak: 0,
    total_hilang: 0,
    keterangan: '',
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
      if (payload.role !== 'peminjam') {
        router.push('/');
        return;
      }
      setUser(payload);
      fetchPeminjaman();
      fetchPengembalian();
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchPeminjaman = async () => {
    try {
      const response = await fetch('/api/peminjam/peminjaman');
      const data = await response.json();
      if (data.success) {
        setPeminjaman(data.peminjaman);
      }
    } catch (error) {
      console.error('Error fetching peminjaman:', error);
    }
  };

  const fetchPengembalian = async () => {
    try {
      const response = await fetch('/api/peminjam/pengembalian');
      const data = await response.json();
      if (data.success) {
        setPengembalian(data.pengembalian);
      }
    } catch (error) {
      console.error('Error fetching pengembalian:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const total = formData.total_baik + formData.total_rusak + formData.total_hilang;
      
      // Validasi: total harus sama dengan jumlah yang dipinjam
      if (total !== selectedPeminjaman.jumlah) {
        alert(`Total kondisi harus sama dengan jumlah yang dipinjam (${selectedPeminjaman.jumlah} unit).`);
        return;
      }

      // Validasi: jika ada rusak atau hilang, keterangan wajib diisi
      if ((formData.total_rusak > 0 || formData.total_hilang > 0) && !formData.keterangan.trim()) {
        alert('Harap isi alasan kerusakan atau kehilangan pada kolom keterangan.');
        return;
      }

      // Validasi: minimal harus ada satu kondisi yang diisi
      if (total === 0) {
        alert('Minimal harus ada satu kondisi yang diisi.');
        return;
      }

      const response = await fetch(`/api/peminjam/pengembalian`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          peminjaman_id: selectedPeminjaman.id,
          tanggal_kembali_aktual: formData.tanggal_kembali_aktual,
          total_baik: formData.total_baik,
          total_rusak: formData.total_rusak,
          total_hilang: formData.total_hilang,
          keterangan: formData.keterangan,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        setSelectedPeminjaman(null);
        setFormData({
          tanggal_kembali_aktual: '',
          total_baik: 0,
          total_rusak: 0,
          total_hilang: 0,
          keterangan: '',
        });
        alert('Pengembalian berhasil diajukan. Mohon tunggu konfirmasi dari petugas.');
        fetchPeminjaman();
        fetchPengembalian();
      } else {
        alert(data.message || 'Terjadi kesalahan');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handleKembali = (p) => {
    setSelectedPeminjaman(p);
    setFormData({
      tanggal_kembali_aktual: new Date().toISOString().split('T')[0],
      total_baik: p.jumlah,
      total_rusak: 0,
      total_hilang: 0,
      keterangan: '',
    });
    setShowModal(true);
  };

  // Filter peminjaman aktif berdasarkan search query
  const filteredActivePeminjaman = useMemo(() => {
    const active = peminjaman.filter(p => 
      p.status === 'disetujui' || p.status === 'dipinjam'
    );
    if (!searchQuery.trim()) return active;
    const query = searchQuery.toLowerCase();
    return active.filter(p => 
      p.alat_nama?.toLowerCase().includes(query) ||
      p.id.toString().includes(query)
    );
  }, [peminjaman, searchQuery]);

  // Get peminjaman that can be returned (disetujui or dipinjam)
  const activePeminjaman = filteredActivePeminjaman;

  // Get peminjaman that are waiting for confirmation or already returned
  const pengembalianData = useMemo(() => {
    return peminjaman.filter(p => 
      p.status === 'menunggu_konfirmasi' || p.status === 'dikembalikan'
    ).map(p => {
      const pg = pengembalian.find(pg => pg.peminjaman_id === p.id);
      return { ...p, pengembalian: pg };
    });
  }, [peminjaman, pengembalian]);

  // Filter pengembalian berdasarkan search query
  const filteredPengembalianData = useMemo(() => {
    if (!searchQuery.trim()) return pengembalianData;
    const query = searchQuery.toLowerCase();
    return pengembalianData.filter(p => 
      p.alat_nama?.toLowerCase().includes(query) ||
      p.id.toString().includes(query)
    );
  }, [pengembalianData, searchQuery]);

  // Pagination untuk pengembalian
  const totalPages = Math.ceil(filteredPengembalianData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPengembalianData = filteredPengembalianData.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Memuat...</div>;
  }

  // Check if peminjaman already has pengembalian
  const hasPengembalian = (peminjamanId) => {
    return pengembalian.some(pg => pg.peminjaman_id === peminjamanId);
  };

  // Parse detail kondisi dari keterangan
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

  // Format kondisi untuk ditampilkan
  const formatKondisi = (pengembalian) => {
    if (!pengembalian) return null;
    
    const detail = parseDetailKondisi(pengembalian.keterangan);
    if (detail) {
      const parts = [];
      if (detail.baik > 0) parts.push(`Baik: ${detail.baik}`);
      if (detail.rusak > 0) parts.push(`Rusak: ${detail.rusak}`);
      if (detail.hilang > 0) parts.push(`Hilang: ${detail.hilang}`);
      return parts.length > 0 ? parts.join(', ') : null;
    }
    
    // Fallback ke kondisi utama jika tidak ada detail
    return pengembalian.kondisi;
  };

  // Check if denda sudah lunas
  const isDendaLunas = (keterangan) => {
    if (!keterangan) return false;
    return /\[Status Pembayaran:\s*Lunas\]/i.test(keterangan);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex w-full overflow-hidden">
      <Sidebar user={user} />
      <div className="ml-0 md:ml-20 lg:ml-64 flex-1 flex flex-col min-h-screen transition-all duration-300 w-full overflow-hidden">
        <Header user={user} title="Kembalikan Alat" />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden w-full">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header Section */}
            <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Kembalikan Alat</h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">Lakukan pengembalian alat yang telah dipinjam</p>
            </div>

            {/* Search Bar */}
            <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari berdasarkan nama alat atau ID peminjaman..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 pl-10 sm:pl-12 text-sm sm:text-base border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all bg-white text-gray-900 placeholder-gray-400"
                />
                <svg className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden mb-4 sm:mb-6">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                <span className="mr-2">📋</span>
                Peminjaman Aktif
              </h2>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alat</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Jumlah</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Tgl Pinjam</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Tgl Kembali</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Status</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {activePeminjaman.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-3xl sm:text-4xl mb-2">📦</span>
                            <p className="text-xs sm:text-sm text-gray-500">Tidak ada peminjaman aktif</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      activePeminjaman.map((p) => (
                        <tr key={p.id} className="hover:bg-green-50/50 transition-colors">
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">#{p.id}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                            <div className="font-medium">{p.alat_nama}</div>
                            <div className="text-gray-500 sm:hidden mt-1">Jumlah: {p.jumlah}</div>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{p.jumlah}</td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                            {p.tanggal_pinjam ? new Date(p.tanggal_pinjam).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden lg:table-cell">
                            {p.tanggal_kembali ? new Date(p.tanggal_kembali).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm hidden sm:table-cell">
                            <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold ${
                              p.status === 'disetujui' ? 'bg-green-100 text-green-800' :
                              p.status === 'dipinjam' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                            {!hasPengembalian(p.id) ? (
                              <button
                                onClick={() => handleKembali(p)}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg sm:rounded-xl hover:bg-blue-700 transition-all duration-200 text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md"
                              >
                                Kembalikan
                              </button>
                            ) : (
                              <span className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">Sudah diajukan</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-3 sm:py-4">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center">
                <span className="mr-2">↩️</span>
                Pengembalian yang Diajukan
              </h2>
            </div>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alat</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Jumlah</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">Tgl Kembali</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kondisi</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Status</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">Denda</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden xl:table-cell">Alasan Denda</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedPengembalianData.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-3xl sm:text-4xl mb-2">📦</span>
                            <p className="text-xs sm:text-sm text-gray-500 px-4">
                              {searchQuery ? 'Tidak ada data yang sesuai dengan pencarian' : 'Belum ada pengembalian yang diajukan'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedPengembalianData.map((p) => {
                        const pg = p.pengembalian;
                        return (
                          <tr key={p.id} className="hover:bg-blue-50/50 transition-colors">
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">#{p.id}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-900">
                              <div className="font-medium">{p.alat_nama}</div>
                              <div className="text-gray-500 sm:hidden mt-1">Jumlah: {p.jumlah}</div>
                              {pg?.denda && pg.denda > 0 && isDendaLunas(pg.keterangan) && (
                                <div className="sm:hidden mt-1">
                                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                    ✓ Lunas
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{p.jumlah}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                              {pg?.tanggal_kembali_aktual ? new Date(pg.tanggal_kembali_aktual).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                              {pg ? (() => {
                                const detail = parseDetailKondisi(pg.keterangan);
                                
                                if (detail) {
                                  return (
                                    <div className="flex flex-wrap gap-1 sm:gap-1.5">
                                      {detail.baik > 0 && (
                                        <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                          Baik: {detail.baik}
                                        </span>
                                      )}
                                      {detail.rusak > 0 && (
                                        <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                          Rusak: {detail.rusak}
                                        </span>
                                      )}
                                      {detail.hilang > 0 && (
                                        <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                          Hilang: {detail.hilang}
                                        </span>
                                      )}
                                    </div>
                                  );
                                }
                                
                                // Fallback ke kondisi utama jika tidak ada detail
                                return (
                                  <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold ${
                                    pg.kondisi === 'baik' ? 'bg-green-100 text-green-800' :
                                    pg.kondisi === 'rusak' ? 'bg-red-100 text-red-800' :
                                    'bg-amber-100 text-amber-800'
                                  }`}>
                                    {pg.kondisi}
                                  </span>
                                );
                              })() : (
                                '-'
                              )}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm hidden sm:table-cell">
                              <div className="flex flex-col gap-1">
                                <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold w-fit ${
                                  p.status === 'menunggu_konfirmasi' ? 'bg-amber-100 text-amber-800' :
                                  p.status === 'dikembalikan' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {p.status === 'menunggu_konfirmasi' ? 'Menunggu' : p.status}
                                </span>
                                {pg?.denda && pg.denda > 0 && isDendaLunas(pg.keterangan) && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold w-fit">
                                    ✓ Lunas
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold hidden lg:table-cell">
                              {pg?.denda && pg.denda > 0 ? (
                                <div className="flex flex-col gap-1">
                                  <span className="text-red-600">
                                    Rp {Number(pg.denda).toLocaleString('id-ID')}
                                  </span>
                                  {isDendaLunas(pg.keterangan) && (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-semibold w-fit">
                                      ✓ Lunas
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 max-w-xs hidden xl:table-cell">
                              {pg?.keterangan ? (() => {
                                const alasanMatch = pg.keterangan.match(/\[Alasan Denda:\s*(.+?)\]/);
                                return alasanMatch ? (
                                  <span className="text-xs" title={alasanMatch[1]}>
                                    {alasanMatch[1].length > 50 ? `${alasanMatch[1].substring(0, 50)}...` : alasanMatch[1]}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                );
                              })() : (
                                <span className="text-gray-400 text-xs">-</span>
                              )}
                            </td>
                      </tr>
                    );
                  })
                )}
                  </tbody>
                </table>
              </div>
            </div>
            {filteredPengembalianData.length > 0 && (
              <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="text-xs sm:text-sm text-gray-600 font-medium text-center sm:text-left">
                  Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredPengembalianData.length)} dari {filteredPengembalianData.length} data
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      currentPage === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md'
                    }`}
                  >
                    Sebelumnya
                  </button>
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 font-medium">
                    {currentPage}/{totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
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
          </div>
          </div>

          {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md transform transition-all max-h-[90vh] overflow-y-auto my-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl sm:rounded-t-2xl sticky top-0 z-10">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Kembalikan Alat</h2>
                  <p className="text-blue-100 text-xs sm:text-sm mt-1 truncate">
                    Alat: {selectedPeminjaman?.alat_nama} (Jumlah: {selectedPeminjaman?.jumlah} unit)
                  </p>
                </div>
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
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
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700">Kondisi Alat</label>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Baik</label>
                      <input
                        type="number"
                        value={formData.total_baik}
                        onChange={(e) => {
                          const value = Math.max(0, parseInt(e.target.value) || 0);
                          setFormData({ ...formData, total_baik: value });
                        }}
                        min="0"
                        max={selectedPeminjaman?.jumlah}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Rusak</label>
                      <input
                        type="number"
                        value={formData.total_rusak}
                        onChange={(e) => {
                          const value = Math.max(0, parseInt(e.target.value) || 0);
                          setFormData({ ...formData, total_rusak: value });
                        }}
                        min="0"
                        max={selectedPeminjaman?.jumlah}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Hilang</label>
                      <input
                        type="number"
                        value={formData.total_hilang}
                        onChange={(e) => {
                          const value = Math.max(0, parseInt(e.target.value) || 0);
                          setFormData({ ...formData, total_hilang: value });
                        }}
                        min="0"
                        max={selectedPeminjaman?.jumlah}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        required
                      />
                    </div>
                    
                    <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                      <p className="text-sm text-gray-700 font-medium">
                        Total: <span className="font-bold text-blue-700">{formData.total_baik + formData.total_rusak + formData.total_hilang}</span> / {selectedPeminjaman?.jumlah} unit
                      </p>
                      {formData.total_baik + formData.total_rusak + formData.total_hilang !== selectedPeminjaman?.jumlah && (
                        <p className="text-xs text-red-600 mt-2 font-semibold">
                          Total harus sama dengan jumlah yang dipinjam
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Keterangan</label>
                    <textarea
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows="3"
                      placeholder="Tulis alasan jika ada alat rusak atau hilang..."
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Jika ada alat <span className="font-semibold text-red-600">rusak</span> atau{' '}
                      <span className="font-semibold text-amber-600">hilang</span>, keterangan wajib diisi.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl"
                    >
                      Kembalikan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedPeminjaman(null);
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-gray-300 transition-all duration-200 text-sm sm:text-base font-semibold"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

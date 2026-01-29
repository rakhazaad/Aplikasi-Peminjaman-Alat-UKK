'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function PinjamPage() {
  const router = useRouter();
  const [alat, setAlat] = useState([]);
  const [peminjaman, setPeminjaman] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedAlat, setSelectedAlat] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    alat_id: '',
    jumlah: 1,
    tanggal_pinjam: '',
    tanggal_kembali: '',
    keterangan: '',
  });

  // Filter alat berdasarkan search query
  const filteredAlat = useMemo(() => {
    if (!searchQuery.trim()) return alat;
    const query = searchQuery.toLowerCase();
    return alat.filter(a => 
      a.nama.toLowerCase().includes(query) ||
      (a.deskripsi && a.deskripsi.toLowerCase().includes(query)) ||
      (a.kategori_nama && a.kategori_nama.toLowerCase().includes(query))
    );
  }, [alat, searchQuery]);

  // Group alat by kategori
  const alatByKategori = useMemo(() => {
    const grouped = {};
    filteredAlat.forEach((a) => {
      const kategori = a.kategori_nama || 'Tanpa Kategori';
      if (!grouped[kategori]) {
        grouped[kategori] = [];
      }
      grouped[kategori].push(a);
    });
    return grouped;
  }, [filteredAlat]);

  // Define fetch functions before using them in useEffect
  const fetchAlat = useCallback(async () => {
    try {
      const response = await fetch('/api/peminjam/alat');
      const data = await response.json();
      if (data.success) {
        // Tampilkan semua alat, termasuk yang jumlahnya 0
        setAlat(data.alat);
      }
    } catch (error) {
      console.error('Error fetching alat:', error);
    }
  }, []);

  const fetchPeminjaman = useCallback(async () => {
    try {
      const response = await fetch('/api/peminjam/peminjaman');
      const data = await response.json();
      if (data.success) {
        // Filter hanya peminjaman yang masih aktif (pending, disetujui, dipinjam)
        const activePeminjaman = data.peminjaman.filter(
          p => ['pending', 'disetujui', 'dipinjam'].includes(p.status)
        );
        setPeminjaman(activePeminjaman);
      }
    } catch (error) {
      console.error('Error fetching peminjaman:', error);
    }
  }, []);

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
      fetchAlat();
      fetchPeminjaman();
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, fetchAlat, fetchPeminjaman]);

  // Auto-refresh peminjaman jika ada yang pending (check setiap 5 detik)
  useEffect(() => {
    const hasPending = peminjaman.some(p => p.status === 'pending');
    if (!hasPending || !user) return;

    const interval = setInterval(() => {
      fetchPeminjaman();
    }, 5000); // Refresh setiap 5 detik

    return () => clearInterval(interval);
  }, [peminjaman, user, fetchPeminjaman]);

  // Auto-refresh alat setiap 30 detik untuk mendapatkan update stok terbaru
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchAlat();
    }, 30000); // Refresh setiap 30 detik

    return () => clearInterval(interval);
  }, [user, fetchAlat]);

  // Function to get peminjaman status for a specific alat
  const getPeminjamanStatus = (alatId) => {
    const peminjamanAktif = peminjaman.find(
      p => p.alat_id === alatId && ['pending', 'disetujui', 'dipinjam'].includes(p.status)
    );
    return peminjamanAktif ? peminjamanAktif.status : null;
  };

  const getPeminjamanData = (alatId) => {
    return peminjaman.find(
      p => p.alat_id === alatId && ['pending', 'disetujui', 'dipinjam'].includes(p.status)
    );
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleDownloadInvoice = (peminjamanData, alatNama) => {
    if (typeof window === 'undefined' || !peminjamanData) return;

    const win = window.open('', '_blank', 'width=900,height=650');
    if (!win) return;

    const html = `
      <html>
        <head>
          <title>Invoice Peminjaman #${peminjamanData.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; background: #f9fafb; }
            .card { max-width: 720px; margin: 0 auto; background: #fff; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 10px 30px rgba(0,0,0,0.08); overflow: hidden; }
            .header { background: linear-gradient(90deg, #2563eb, #1d4ed8); color: #fff; padding: 20px 24px; }
            .header h1 { margin: 0; font-size: 20px; }
            .section { padding: 16px 24px; border-top: 1px solid #f3f4f6; }
            .row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 14px; }
            .label { color: #6b7280; }
            .value { color: #111827; font-weight: 600; }
            .badge { display: inline-block; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
            .status-pending { background: #fef3c7; color: #b45309; }
            .status-disetujui { background: #d1fae5; color: #065f46; }
            .status-dipinjam { background: #dbeafe; color: #1d4ed8; }
            .footer { padding: 16px 24px 24px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="card">
            <div class="header">
              <h1>Invoice / Bukti Pengajuan Peminjaman</h1>
              <div style="margin-top:8px; font-size:14px; color:#e0e7ff;">Nomor: #${peminjamanData.id}</div>
            </div>
            <div class="section">
              <div class="row"><span class="label">Peminjam</span><span class="value">${user?.nama || user?.username || '-'}</span></div>
              <div class="row"><span class="label">Alat</span><span class="value">${alatNama || '-'}</span></div>
              <div class="row"><span class="label">Jumlah</span><span class="value">${peminjamanData.jumlah} unit</span></div>
            </div>
            <div class="section">
              <div class="row"><span class="label">Tanggal Pinjam</span><span class="value">${formatDate(peminjamanData.tanggal_pinjam)}</span></div>
              <div class="row"><span class="label">Tanggal Kembali</span><span class="value">${formatDate(peminjamanData.tanggal_kembali)}</span></div>
            </div>
            <div class="section">
              <div class="row"><span class="label">Status</span>
                <span class="value">
                  <span class="badge ${
                    peminjamanData.status === 'pending' ? 'status-pending' :
                    peminjamanData.status === 'disetujui' ? 'status-disetujui' : 'status-dipinjam'
                  }">${peminjamanData.status}</span>
                </span>
              </div>
              ${peminjamanData.keterangan ? `<div class="row"><span class="label">Keterangan</span><span class="value">${peminjamanData.keterangan}</span></div>` : ''}
            </div>
            <div class="footer">
              Dicetak otomatis dari sistem peminjaman. Simpan sebagai PDF untuk arsip Anda.
            </div>
          </div>
        </body>
      </html>
    `;

    win.document.write(html);
    win.document.close();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/peminjam/peminjaman', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        setFormData({
          alat_id: '',
          jumlah: 1,
          tanggal_pinjam: '',
          tanggal_kembali: '',
          keterangan: '',
        });
        setSelectedAlat(null);
        alert('Peminjaman berhasil diajukan');
        // Refresh data alat dan peminjaman untuk update jumlah dan status
        await fetchAlat();
        await fetchPeminjaman();
      } else {
        alert(data.message || 'Terjadi kesalahan');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handlePinjam = (a) => {
    setSelectedAlat(a);
    setFormData({
      ...formData,
      alat_id: a.id,
    });
    setShowModal(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex w-full overflow-hidden">
      <Sidebar user={user} />
      <div className="ml-0 md:ml-20 lg:ml-64 flex-1 flex flex-col min-h-screen transition-all duration-300 w-full overflow-hidden">
        <Header user={user} title="Ajukan Peminjaman" />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden w-full">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header Section */}
            <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Ajukan Peminjaman</h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">Pilih alat yang ingin Anda pinjam</p>
            </div>

            {/* Search Bar */}
            <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari alat berdasarkan nama, deskripsi, atau kategori..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 pl-10 sm:pl-12 text-sm sm:text-base border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all bg-white text-gray-900 placeholder-gray-400"
                />
                <svg className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

          {Object.keys(alatByKategori).length === 0 ? (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-12 text-center">
              <div className="flex flex-col items-center">
                <span className="text-4xl sm:text-6xl mb-3 sm:mb-4">🔍</span>
                <p className="text-gray-600 text-base sm:text-lg">Tidak ada alat tersedia</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {Object.entries(alatByKategori).map(([kategori, alatList]) => (
                <div key={kategori} className="mb-4 sm:mb-6 lg:mb-8">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-t-xl sm:rounded-t-2xl shadow-lg">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold flex items-center">
                      <span className="mr-2 sm:mr-3 text-xl sm:text-2xl">📁</span>
                      <span className="truncate">{kategori}</span>
                    </h2>
                  </div>
                  <div className="bg-white rounded-b-xl sm:rounded-b-2xl shadow-lg p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {alatList.map((a) => {
                        const peminjamanStatus = getPeminjamanStatus(a.id);
                        const isPending = peminjamanStatus === 'pending';
                        const isApproved = peminjamanStatus === 'disetujui' || peminjamanStatus === 'dipinjam';
                        const hasActivePeminjaman = isPending || isApproved;
                        const isAvailable = a.jumlah > 0 && a.status === 'tersedia';
                        const canPinjam = !isPending && !isApproved && isAvailable;
                        const showNotAvailable = !isAvailable && !hasActivePeminjaman;

                        return (
                          <div key={a.id} className="border-2 border-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 bg-white">
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex-1 pr-2">{a.nama}</h3>
                              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ml-2 flex-shrink-0 ${
                                isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {isAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                              </span>
                            </div>
                            <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed min-h-[2.5rem] sm:min-h-[3rem] line-clamp-3">
                              {a.deskripsi || 'Tidak ada deskripsi'}
                            </p>
                            <div className="flex items-center mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-100">
                              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                              <span className="text-xs sm:text-sm text-gray-700 font-medium">Tersedia: {a.jumlah}</span>
                            </div>
                            {hasActivePeminjaman ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                                    isPending ? 'bg-amber-100 text-amber-800' :
                                    isApproved ? 'bg-green-100 text-green-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {peminjamanStatus === 'dipinjam' ? 'Sedang Dipinjam' : peminjamanStatus}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDownloadInvoice(getPeminjamanData(a.id), a.nama)}
                                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                  Unduh Invoice
                                </button>
                              </div>
                            ) : canPinjam ? (
                              <button
                                onClick={() => handlePinjam(a)}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                              >
                                Pinjam Sekarang
                              </button>
                            ) : showNotAvailable ? (
                              <button
                                disabled
                                className="w-full bg-gray-300 text-gray-500 py-2.5 sm:py-3 rounded-lg sm:rounded-xl cursor-not-allowed text-sm sm:text-base font-semibold"
                              >
                                Alat Tidak Tersedia
                              </button>
                            ) : isPending ? (
                              <button
                                disabled
                                className="w-full bg-amber-400 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl cursor-not-allowed text-sm sm:text-base font-semibold"
                              >
                                Menunggu Konfirmasi
                              </button>
                            ) : isApproved ? (
                              <button
                                disabled
                                className="w-full bg-green-500 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl cursor-not-allowed text-sm sm:text-base font-semibold"
                              >
                                ✓ Berhasil Dipinjam
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md transform transition-all my-4 max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl sm:rounded-t-2xl sticky top-0 z-10">
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Ajukan Peminjaman</h2>
                  <p className="text-blue-100 text-xs sm:text-sm mt-1 truncate">Alat: {selectedAlat?.nama}</p>
                </div>
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah</label>
                    <input
                      type="number"
                      value={formData.jumlah}
                      onChange={(e) => setFormData({ ...formData, jumlah: parseInt(e.target.value) })}
                      required
                      min="1"
                      max={selectedAlat?.jumlah}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <p className="text-xs text-gray-500 mt-2">Maksimal: {selectedAlat?.jumlah} unit</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Pinjam</label>
                    <input
                      type="date"
                      value={formData.tanggal_pinjam}
                      onChange={(e) => setFormData({ ...formData, tanggal_pinjam: e.target.value })}
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Kembali</label>
                    <input
                      type="date"
                      value={formData.tanggal_kembali}
                      onChange={(e) => setFormData({ ...formData, tanggal_kembali: e.target.value })}
                      required
                      min={formData.tanggal_pinjam || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Keterangan</label>
                    <textarea
                      value={formData.keterangan}
                      onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows="3"
                      placeholder="Alasan peminjaman..."
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl"
                    >
                      Ajukan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedAlat(null);
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
          </div>
        </main>
      </div>
    </div>
  );
}

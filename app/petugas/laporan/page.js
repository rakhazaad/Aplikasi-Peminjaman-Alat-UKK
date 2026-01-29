'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function LaporanPage() {
  const router = useRouter();
  const [laporan, setLaporan] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
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
      fetchLaporan();
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchLaporan = async () => {
    try {
      const response = await fetch('/api/petugas/laporan');
      const data = await response.json();
      if (data.success) {
        setLaporan(data.laporan);
      }
    } catch (error) {
      console.error('Error fetching laporan:', error);
    }
  };

  // Filter detail laporan berdasarkan search query
  const filteredDetail = useMemo(() => {
    if (!laporan || !laporan.detail) return [];
    if (!searchQuery.trim()) return laporan.detail;
    const query = searchQuery.toLowerCase();
    return laporan.detail.filter(item => 
      item.peminjam_nama?.toLowerCase().includes(query) ||
      item.alat_nama?.toLowerCase().includes(query) ||
      item.id.toString().includes(query) ||
      item.status?.toLowerCase().includes(query)
    );
  }, [laporan, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredDetail.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDetail = filteredDetail.slice(startIndex, endIndex);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const handleBeforePrint = () => setIsPrinting(true);
    const handleAfterPrint = () => setIsPrinting(false);

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Tampilkan semua data saat print, paginated saat normal
  const displayData = isPrinting ? filteredDetail : paginatedDetail;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Memuat...</div>;
  }

  return (
    <>
      <style jsx>{`
        @media print {
          /* Sembunyikan sidebar - gunakan selector yang lebih spesifik */
          aside,
          nav[class*="Sidebar"],
          div[class*="sidebar"],
          div[class*="Sidebar"],
          .sidebar,
          [class*="fixed"][class*="left-0"] {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Sembunyikan elemen yang tidak perlu saat print */
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Reset margin dan padding untuk print */
          body,
          html {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Hapus margin kiri dari konten saat print */
          .print-content,
          [class*="ml-64"],
          [class*="ml-20"],
          div[class*="ml-64"],
          div[class*="ml-20"] {
            margin-left: 0 !important;
            margin-right: 0 !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            left: 0 !important;
          }
          
          /* Pastikan konten utama tidak memiliki margin dari sidebar */
          body > div,
          html > body > div {
            margin-left: 0 !important;
          }
          
          /* Full width untuk konten saat print */
          .print-content {
            width: 100% !important;
            max-width: 100% !important;
          }
          
          /* Container utama */
          main,
          div[class*="max-w"] {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
          }
          
          /* Styling untuk header laporan saat print */
          .print-header {
            page-break-after: avoid;
            margin-bottom: 20px;
          }
          
          /* Styling untuk statistik cards saat print */
          .print-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          /* Styling tabel saat print */
          .print-table {
            width: 100% !important;
            max-width: 100% !important;
            border-collapse: collapse;
            font-size: 9px;
            margin: 0;
          }
          
          .print-table thead {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            display: table-header-group;
          }
          
          .print-table th {
            border: 1px solid #d1d5db;
            padding: 6px 4px;
            text-align: left;
            font-weight: 600;
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .print-table td {
            border: 1px solid #d1d5db;
            padding: 6px 4px;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          
          .print-table tbody tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          .print-table tbody tr:nth-child(even) {
            background-color: #f9fafb;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Badge styling saat print */
          .print-badge {
            padding: 3px 6px;
            border-radius: 3px;
            font-size: 8px;
            font-weight: 600;
            border: 1px solid #d1d5db;
            display: inline-block;
          }
          
          /* Hapus overflow hidden saat print */
          body,
          html,
          main,
          div {
            overflow: visible !important;
          }
          
          /* Print page setup */
          @page {
            size: A4 landscape;
            margin: 0.5cm;
          }
          
          /* Pastikan background colors tercetak */
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* Pastikan konten tidak terpotong */
          .bg-white,
          [class*="bg-white"] {
            box-shadow: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="no-print">
        <Sidebar user={user} />
      </div>
      <div className="ml-64 flex-1 flex flex-col min-h-screen print-content">
        <Header 
          user={user} 
          title="Cetak Laporan"
          actions={
            <button
              onClick={handlePrint}
              className="no-print px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
            >
              🖨️ Cetak Laporan
            </button>
          }
        />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8 no-print">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Laporan Peminjaman Alat</h1>
              <p className="text-gray-600">Ringkasan dan detail aktivitas peminjaman alat</p>
            </div>

          {laporan && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden print:shadow-none">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 print-header">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <span className="mr-2">📄</span>
                  Laporan Peminjaman Alat
                </h2>
                <p className="text-blue-100 text-sm mt-1">Periode: {new Date().toLocaleDateString('id-ID')}</p>
              </div>
              <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print-stats">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <h3 className="text-sm font-medium text-blue-100 mb-2">Total Peminjaman</h3>
                  <p className="text-4xl font-bold">{laporan.total_peminjaman}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <h3 className="text-sm font-medium text-green-100 mb-2">Dikembalikan</h3>
                  <p className="text-4xl font-bold">{laporan.dikembalikan}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <h3 className="text-sm font-medium text-amber-100 mb-2">Pending</h3>
                  <p className="text-4xl font-bold">{laporan.pending}</p>
                </div>
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <h3 className="text-sm font-medium text-red-100 mb-2">Ditolak</h3>
                  <p className="text-4xl font-bold">{laporan.ditolak}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Detail Peminjaman</h3>
                
                {/* Search Bar */}
                <div className="mb-6 no-print">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari berdasarkan ID, nama peminjam, nama alat, atau status..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-6 py-4 pl-12 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all bg-white text-gray-900 placeholder-gray-400"
                    />
                    <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 print-table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Peminjam</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alat</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jumlah</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status Pengembalian</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Denda</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {displayData.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center">
                              <span className="text-4xl mb-2">📦</span>
                              <p className="text-sm text-gray-500">
                                {searchQuery ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data peminjaman'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        displayData.map((item) => {
                          // Check if terlambat (tanggal_kembali_aktual > tanggal_kembali)
                          const isTelat = item.status === 'dikembalikan' && 
                            item.tanggal_kembali && 
                            item.tanggal_kembali_aktual && 
                            new Date(item.tanggal_kembali_aktual) > new Date(item.tanggal_kembali);
                          const rowClassName = isTelat ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-blue-50/50';
                          
                          return (
                            <tr key={item.id} className={`transition-colors ${rowClassName}`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.id}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.peminjam_nama}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.alat_nama}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.jumlah}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold print-badge ${
                                  item.status === 'disetujui' ? 'bg-green-100 text-green-800' :
                                  item.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                  item.status === 'ditolak' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {item.tanggal_pinjam ? new Date(item.tanggal_pinjam).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {item.status === 'dikembalikan' ? (
                                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold print-badge ${
                                    isTelat ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {isTelat ? '⚠️ Telat' : '✓ Tepat Waktu'}
                                  </span>
                                ) : (
                                  <span className="px-3 py-1.5 rounded-full text-xs font-semibold print-badge bg-gray-100 text-gray-800">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                {item.denda && item.denda > 0 ? (
                                  <span className="text-red-600">Rp {Number(item.denda).toLocaleString('id-ID')}</span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredDetail.length > 0 && (
                  <div className="no-print mt-6 px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
                    <div className="text-sm text-gray-600 font-medium">
                      Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredDetail.length)} dari {filteredDetail.length} data
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
              </div>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
    </>
  );
}

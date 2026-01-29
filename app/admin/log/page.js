'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function LogPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedItems, setSelectedItems] = useState([]);

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
      fetchLogs();
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchLogs = async () => {
    try {
      const response = await fetch('/api/admin/log');
      const data = await response.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(paginatedLogs.map(log => log.id));
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

    if (!confirm(`Yakin ingin menghapus ${selectedItems.length} data log yang dipilih?`)) return;

    try {
      const deletePromises = selectedItems.map(id => 
        fetch(`/api/admin/log/${id}`, { method: 'DELETE' })
      );
      
      const results = await Promise.all(deletePromises);
      const dataResults = await Promise.all(results.map(r => r.json()));
      
      const allSuccess = dataResults.every(r => r.success);
      
      if (allSuccess) {
        fetchLogs();
        setSelectedItems([]);
        alert(`${selectedItems.length} data berhasil dihapus`);
      } else {
        alert('Beberapa data gagal dihapus');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menghapus data');
    }
  };

  // Filter logs berdasarkan search query
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const query = searchQuery.toLowerCase();
    return logs.filter(log => 
      log.user_nama?.toLowerCase().includes(query) ||
      log.aksi?.toLowerCase().includes(query) ||
      log.tabel?.toLowerCase().includes(query) ||
      log.detail?.toLowerCase().includes(query) ||
      log.id.toString().includes(query) ||
      log.record_id?.toString().includes(query)
    );
  }, [logs, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

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
        <Header user={user} title="Log Aktifitas" />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Log Aktifitas</h1>
              <p className="text-gray-600">Riwayat aktivitas sistem</p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cari berdasarkan ID, user, aksi, tabel, record ID, atau detail..."
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
                  <span className="mr-2">📋</span>
                  Daftar Log Aktifitas
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
                          checked={paginatedLogs.length > 0 && selectedItems.length === paginatedLogs.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tabel</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Record ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Detail</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedLogs.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-4xl mb-2">📦</span>
                            <p className="text-sm text-gray-500">
                              {searchQuery ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data log'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedLogs.map((log) => (
                        <tr key={log.id} className={`hover:bg-blue-50/50 transition-colors ${selectedItems.includes(log.id) ? 'bg-blue-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(log.id)}
                              onChange={() => handleSelectItem(log.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.user_nama || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                              log.aksi === 'LOGIN' ? 'bg-purple-100 text-purple-800' :
                              log.aksi === 'LOGOUT' ? 'bg-orange-100 text-orange-800' :
                              log.aksi === 'INSERT' ? 'bg-green-100 text-green-800' :
                              log.aksi === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                              log.aksi === 'DELETE' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {log.aksi}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.tabel || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.record_id || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{log.detail || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {log.created_at ? new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {filteredLogs.length > 0 && (
              <div className="mt-6 px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
                <div className="text-sm text-gray-600 font-medium">
                  Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredLogs.length)} dari {filteredLogs.length} data
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
        </main>
      </div>
    </div>
  );
}

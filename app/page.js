'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

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
      setUser(payload);
      
      // Fetch dashboard data if admin, petugas, or peminjam
      if (payload.role === 'admin') {
        fetchAdminDashboardData();
      } else if (payload.role === 'petugas') {
        fetchPetugasDashboardData();
      } else if (payload.role === 'peminjam') {
        fetchPeminjamDashboardData();
      } else {
        setLoadingData(false);
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchAdminDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      const data = await response.json();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchPetugasDashboardData = async () => {
    try {
      const response = await fetch('/api/petugas/dashboard');
      const data = await response.json();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const fetchPeminjamDashboardData = async () => {
    try {
      const response = await fetch('/api/peminjam/dashboard');
      const data = await response.json();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Memuat...</div>
      </div>
    );
  }

  // Admin dashboard
  if (user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar user={user} />
        <div className="ml-64 flex-1 flex flex-col min-h-screen">
          <Header user={user} title="Dashboard" />
          <main className="flex-1 p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {loadingData ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data...</p>
                  </div>
                </div>
              ) : dashboardData ? (
                <>
                  {/* Welcome Section */}
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Selamat Datang, {user?.nama || user?.username}!
                    </h1>
                    <p className="text-gray-600">Ringkasan aktivitas sistem</p>
                  </div>

                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm font-medium mb-1">Total User</p>
                          <p className="text-4xl font-bold">
                            {dashboardData.statistics.totalUsers}
                          </p>
                          <p className="text-blue-100 text-xs mt-2">Pengguna terdaftar</p>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                          <span className="text-3xl">👥</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm font-medium mb-1">Total Alat</p>
                          <p className="text-4xl font-bold">
                            {dashboardData.statistics.totalAlat}
                          </p>
                          <p className="text-green-100 text-xs mt-2">Alat tersedia</p>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                          <span className="text-3xl">🔧</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm font-medium mb-1">Total Kategori</p>
                          <p className="text-4xl font-bold">
                            {dashboardData.statistics.totalKategori}
                          </p>
                          <p className="text-purple-100 text-xs mt-2">Jenis kategori</p>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                          <span className="text-3xl">📁</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Latest Data Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Latest Peminjaman */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                        <h3 className="text-lg font-bold text-white flex items-center">
                          <span className="mr-2">📝</span>
                          Peminjaman Terbaru
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Peminjam</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alat</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {dashboardData.latestPeminjaman.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="px-6 py-12 text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-4xl mb-2">📦</span>
                                    <p className="text-sm text-gray-500">Tidak ada data peminjaman</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              dashboardData.latestPeminjaman.map((p) => (
                                <tr key={p.id} className="hover:bg-blue-50/50 transition-colors">
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.peminjam_nama || '-'}</td>
                                  <td className="px-6 py-4 text-sm text-gray-900">{p.alat_nama || '-'}</td>
                                  <td className="px-6 py-4 text-sm">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                      p.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                      p.status === 'disetujui' ? 'bg-green-100 text-green-800' :
                                      p.status === 'ditolak' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {p.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Latest Pengembalian */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                        <h3 className="text-lg font-bold text-white flex items-center">
                          <span className="mr-2">↩️</span>
                          Pengembalian Terbaru
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Peminjam</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alat</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kondisi</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {dashboardData.latestPengembalian.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="px-6 py-12 text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-4xl mb-2">📦</span>
                                    <p className="text-sm text-gray-500">Tidak ada data pengembalian</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              dashboardData.latestPengembalian.map((pg) => {
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
                                const detailKondisi = parseDetailKondisi(pg.keterangan);
                                return (
                                  <tr key={pg.id} className="hover:bg-green-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{pg.peminjam_nama || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{pg.alat_nama || '-'}</td>
                                    <td className="px-6 py-4 text-sm">
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
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                          pg.kondisi === 'baik' ? 'bg-green-100 text-green-800' :
                                          pg.kondisi === 'rusak' ? 'bg-red-100 text-red-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {pg.kondisi}
                                        </span>
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

                    {/* Latest Log Aktifitas */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                        <h3 className="text-lg font-bold text-white flex items-center">
                          <span className="mr-2">📋</span>
                          Log Aktifitas Terbaru
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tabel</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {dashboardData.latestLogs.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="px-6 py-12 text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-4xl mb-2">📦</span>
                                    <p className="text-sm text-gray-500">Tidak ada data log</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              dashboardData.latestLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-purple-50/50 transition-colors">
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.user_nama || '-'}</td>
                                  <td className="px-6 py-4 text-sm">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                      log.aksi === 'INSERT' ? 'bg-green-100 text-green-800' :
                                      log.aksi === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                                      log.aksi === 'DELETE' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {log.aksi}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{log.tabel || '-'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">Gagal memuat data dashboard</div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Petugas dashboard
  if (user?.role === 'petugas') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Sidebar user={user} />
        <div className="ml-64 flex-1 flex flex-col min-h-screen">
          <Header user={user} title="Dashboard" />
          <main className="flex-1 p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {loadingData ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data...</p>
                  </div>
                </div>
              ) : dashboardData ? (
                <>
                  {/* Welcome Section */}
                  <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      Selamat Datang, {user?.nama || user?.username}!
                    </h1>
                    <p className="text-gray-600">Ringkasan aktivitas peminjaman dan pengembalian</p>
                  </div>

                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-amber-100 text-sm font-medium mb-1">Total Pending Peminjaman</p>
                          <p className="text-4xl font-bold">
                            {dashboardData.statistics.totalPendingPeminjaman}
                          </p>
                          <p className="text-amber-100 text-xs mt-2">Menunggu persetujuan</p>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                          <span className="text-3xl">📝</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-teal-100 text-sm font-medium mb-1">Total Pending Pengembalian</p>
                          <p className="text-4xl font-bold">
                            {dashboardData.statistics.totalPendingPengembalian}
                          </p>
                          <p className="text-teal-100 text-xs mt-2">Menunggu konfirmasi</p>
                        </div>
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                          <span className="text-3xl">↩️</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Latest Data Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Latest Peminjaman */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
                        <h3 className="text-lg font-bold text-white flex items-center">
                          <span className="mr-2">📝</span>
                          Peminjaman Terbaru
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Peminjam</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alat</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {dashboardData.latestPeminjaman.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="px-6 py-12 text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-4xl mb-2">📦</span>
                                    <p className="text-sm text-gray-500">Tidak ada data peminjaman</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              dashboardData.latestPeminjaman.map((p) => (
                                <tr key={p.id} className="hover:bg-amber-50/50 transition-colors">
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.peminjam_nama || '-'}</td>
                                  <td className="px-6 py-4 text-sm text-gray-900">{p.alat_nama || '-'}</td>
                                  <td className="px-6 py-4 text-sm">
                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                      p.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                      p.status === 'disetujui' ? 'bg-green-100 text-green-800' :
                                      p.status === 'ditolak' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {p.status}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Latest Pengembalian */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-4">
                        <h3 className="text-lg font-bold text-white flex items-center">
                          <span className="mr-2">↩️</span>
                          Pengembalian Terbaru
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Peminjam</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alat</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kondisi</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {dashboardData.latestPengembalian.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="px-6 py-12 text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-4xl mb-2">📦</span>
                                    <p className="text-sm text-gray-500">Tidak ada data pengembalian</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              dashboardData.latestPengembalian.map((pg) => {
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
                                const detailKondisi = parseDetailKondisi(pg.keterangan);
                                return (
                                  <tr key={pg.id} className="hover:bg-teal-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{pg.peminjam_nama || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-900">{pg.alat_nama || '-'}</td>
                                    <td className="px-6 py-4 text-sm">
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
                                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                          pg.kondisi === 'baik' ? 'bg-green-100 text-green-800' :
                                          pg.kondisi === 'rusak' ? 'bg-red-100 text-red-800' :
                                          'bg-yellow-100 text-yellow-800'
                                        }`}>
                                          {pg.kondisi}
                                        </span>
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

                    {/* Latest Detail Peminjaman */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                        <h3 className="text-lg font-bold text-white flex items-center">
                          <span className="mr-2">📊</span>
                          Detail Peminjaman Terbaru
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Peminjam</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alat</th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jumlah</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {dashboardData.latestDetailPeminjaman.length === 0 ? (
                              <tr>
                                <td colSpan="3" className="px-6 py-12 text-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-4xl mb-2">📦</span>
                                    <p className="text-sm text-gray-500">Tidak ada data detail</p>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              dashboardData.latestDetailPeminjaman.map((p) => (
                                <tr key={p.id} className="hover:bg-blue-50/50 transition-colors">
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.peminjam_nama || '-'}</td>
                                  <td className="px-6 py-4 text-sm text-gray-900">{p.alat_nama || '-'}</td>
                                  <td className="px-6 py-4 text-sm text-gray-600">{p.jumlah}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">Gagal memuat data dashboard</div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Peminjam dashboard
  if (user?.role === 'peminjam') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex w-full overflow-hidden">
        <Sidebar user={user} />
        <div className="ml-0 md:ml-20 lg:ml-64 flex-1 flex flex-col min-h-screen transition-all duration-300 w-full overflow-hidden">
        <Header user={user} title="Dashboard" />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden w-full">
          <div className="max-w-7xl mx-auto w-full">
              {loadingData ? (
                <div className="flex items-center justify-center py-12 sm:py-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
                    <p className="text-sm sm:text-base text-gray-600">Memuat data...</p>
                  </div>
                </div>
              ) : dashboardData ? (
                <>
                  {/* Welcome Section */}
                  <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                      Selamat Datang, {user?.nama || user?.username}!
                    </h1>
                    <p className="text-xs sm:text-sm md:text-base text-gray-600">Ringkasan aktivitas peminjaman Anda</p>
                  </div>

                  {/* Statistics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-3 sm:mb-4 md:mb-6 lg:mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-blue-100 text-xs sm:text-sm font-medium mb-1">Total Alat</p>
                          <p className="text-2xl sm:text-3xl md:text-4xl font-bold">
                            {dashboardData.statistics.totalAlat}
                          </p>
                          <p className="text-blue-100 text-xs mt-1 sm:mt-2">Alat tersedia</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-white/20 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0 ml-2">
                          <span className="text-xl sm:text-2xl md:text-3xl">🔧</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-purple-100 text-xs sm:text-sm font-medium mb-1">Total Kategori</p>
                          <p className="text-2xl sm:text-3xl md:text-4xl font-bold">
                            {dashboardData.statistics.totalKategori}
                          </p>
                          <p className="text-purple-100 text-xs mt-1 sm:mt-2">Jenis kategori</p>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-white/20 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0 ml-2">
                          <span className="text-xl sm:text-2xl md:text-3xl">📁</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Latest Data Tables */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                    {/* Latest Pengembalian yang Diajukan */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 sm:px-6 py-3 sm:py-4">
                        <h3 className="text-base sm:text-lg font-bold text-white flex items-center">
                          <span className="mr-2">↩️</span>
                          Pengembalian yang Diajukan
                        </h3>
                      </div>
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alat</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kondisi</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {dashboardData.latestPengembalian.length === 0 ? (
                                <tr>
                                  <td colSpan="3" className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                    <div className="flex flex-col items-center">
                                      <span className="text-3xl sm:text-4xl mb-2">📦</span>
                                      <p className="text-xs sm:text-sm text-gray-500">Tidak ada data pengembalian</p>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                dashboardData.latestPengembalian.map((pg) => {
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
                                  const detailKondisi = parseDetailKondisi(pg.keterangan);
                                  return (
                                    <tr key={pg.pengembalian_id || pg.peminjaman_id} className="hover:bg-blue-50/50 transition-colors">
                                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">{pg.alat_nama || '-'}</td>
                                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                                        {detailKondisi ? (
                                          <div className="flex flex-wrap gap-1">
                                            {detailKondisi.baik > 0 && (
                                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                Baik: {detailKondisi.baik}
                                              </span>
                                            )}
                                            {detailKondisi.rusak > 0 && (
                                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                Rusak: {detailKondisi.rusak}
                                              </span>
                                            )}
                                            {detailKondisi.hilang > 0 && (
                                              <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                                Hilang: {detailKondisi.hilang}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            pg.kondisi === 'baik' ? 'bg-green-100 text-green-800' :
                                            pg.kondisi === 'rusak' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {pg.kondisi || '-'}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm hidden sm:table-cell">
                                        <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold ${
                                          pg.status === 'menunggu_konfirmasi' ? 'bg-amber-100 text-amber-800' :
                                          pg.status === 'dikembalikan' ? 'bg-green-100 text-green-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {pg.status === 'menunggu_konfirmasi' ? 'Menunggu' : pg.status || '-'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Latest Peminjaman Aktif */}
                    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 sm:px-6 py-3 sm:py-4">
                        <h3 className="text-base sm:text-lg font-bold text-white flex items-center">
                          <span className="mr-2">📝</span>
                          Peminjaman Aktif
                        </h3>
                      </div>
                      <div className="overflow-x-auto -mx-4 sm:mx-0">
                        <div className="inline-block min-w-full align-middle">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alat</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">Jumlah</th>
                                <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                              {dashboardData.latestPeminjamanAktif.length === 0 ? (
                                <tr>
                                  <td colSpan="3" className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                                    <div className="flex flex-col items-center">
                                      <span className="text-3xl sm:text-4xl mb-2">📋</span>
                                      <p className="text-xs sm:text-sm text-gray-500">Tidak ada peminjaman aktif</p>
                                    </div>
                                  </td>
                                </tr>
                              ) : (
                                dashboardData.latestPeminjamanAktif.map((p) => (
                                  <tr key={p.id} className="hover:bg-green-50/50 transition-colors">
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                                      <div>{p.alat_nama || '-'}</div>
                                      <div className="text-gray-500 sm:hidden mt-1">Jumlah: {p.jumlah}</div>
                                    </td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden sm:table-cell">{p.jumlah}</td>
                                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm">
                                      <span className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-semibold ${
                                        p.status === 'disetujui' ? 'bg-green-100 text-green-800' :
                                        p.status === 'dipinjam' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {p.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">Gagal memuat data dashboard</div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Default dashboard (fallback)
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar user={user} />
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        <Header user={user} title="Dashboard" />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Selamat datang, {user?.nama || user?.username}!
              </h2>
              <p className="text-gray-600">
                Role: <span className="font-semibold capitalize">{user?.role}</span>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

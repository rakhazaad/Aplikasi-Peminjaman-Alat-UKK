'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function AlatListPage() {
  const router = useRouter();
  const [alat, setAlat] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchAlat = async () => {
    try {
      const response = await fetch('/api/peminjam/alat');
      const data = await response.json();
      if (data.success) {
        setAlat(data.alat);
      }
    } catch (error) {
      console.error('Error fetching alat:', error);
    }
  };

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

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex w-full overflow-hidden">
      <Sidebar user={user} />
      <div className="ml-0 md:ml-20 lg:ml-64 flex-1 flex flex-col min-h-screen transition-all duration-300 w-full overflow-hidden">
        <Header user={user} title="Daftar Alat" />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto overflow-x-hidden w-full">
          <div className="max-w-7xl mx-auto w-full">
            {/* Header Section */}
            <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Daftar Alat</h1>
              <p className="text-xs sm:text-sm md:text-base text-gray-600">Jelajahi alat-alat yang tersedia untuk dipinjam</p>
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
                  <p className="text-gray-600 text-base sm:text-lg">Tidak ada alat yang tersedia</p>
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
                        {alatList.map((a) => (
                          <div key={a.id} className="border-2 border-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 bg-white">
                            <div className="flex items-start justify-between mb-3 sm:mb-4">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex-1 pr-2">{a.nama}</h3>
                              <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-bold ml-2 flex-shrink-0 ${
                                a.status === 'tersedia' ? 'bg-green-100 text-green-800' :
                                a.status === 'dipinjam' ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                <span className="hidden sm:inline">{a.status}</span>
                                <span className="sm:hidden">{a.status === 'tersedia' ? 'Tersedia' : a.status === 'dipinjam' ? 'Dipinjam' : 'Rusak'}</span>
                              </span>
                            </div>
                            <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed min-h-[2.5rem] sm:min-h-[3rem] line-clamp-3">
                              {a.deskripsi || 'Tidak ada deskripsi'}
                            </p>
                            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-100">
                              <div className="flex items-center text-gray-700">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <span className="text-xs sm:text-sm font-semibold">Jumlah: {a.jumlah}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

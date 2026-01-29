'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

export default function PeminjamanPage() {
  const router = useRouter();
  const [peminjaman, setPeminjaman] = useState([]);
  const [users, setUsers] = useState([]);
  const [alat, setAlat] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPeminjaman, setEditingPeminjaman] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedItems, setSelectedItems] = useState([]);
  const [formData, setFormData] = useState({
    peminjam_id: '',
    alat_id: '',
    jumlah: 1,
    tanggal_pinjam: '',
    tanggal_kembali: '',
    status: 'pending',
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
      if (payload.role !== 'admin') {
        router.push('/');
        return;
      }
      setUser(payload);
      fetchPeminjaman();
      fetchUsers();
      fetchAlat();
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.users.filter(u => u.role === 'peminjam'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAlat = async () => {
    try {
      const response = await fetch('/api/admin/alat');
      const data = await response.json();
      if (data.success) {
        setAlat(data.alat);
      }
    } catch (error) {
      console.error('Error fetching alat:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingPeminjaman
        ? `/api/admin/peminjaman/${editingPeminjaman.id}`
        : '/api/admin/peminjaman';
      const method = editingPeminjaman ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        setShowModal(false);
        setEditingPeminjaman(null);
        setFormData({
          peminjam_id: '',
          alat_id: '',
          jumlah: 1,
          tanggal_pinjam: '',
          tanggal_kembali: '',
          status: 'pending',
          keterangan: '',
        });
        fetchPeminjaman();
      } else {
        alert(data.message || 'Terjadi kesalahan');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  const handleEdit = (p) => {
    setEditingPeminjaman(p);
    setFormData({
      peminjam_id: p.peminjam_id,
      alat_id: p.alat_id,
      jumlah: p.jumlah,
      tanggal_pinjam: p.tanggal_pinjam,
      tanggal_kembali: p.tanggal_kembali,
      status: p.status,
      keterangan: p.keterangan || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin ingin menghapus data peminjaman ini?')) return;

    try {
      const response = await fetch(`/api/admin/peminjaman/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        fetchPeminjaman();
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
      setSelectedItems(paginatedPeminjaman.map(p => p.id));
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

    if (!confirm(`Yakin ingin menghapus ${selectedItems.length} data peminjaman yang dipilih?`)) return;

    try {
      const deletePromises = selectedItems.map(id => 
        fetch(`/api/admin/peminjaman/${id}`, { method: 'DELETE' })
      );
      
      const results = await Promise.all(deletePromises);
      const dataResults = await Promise.all(results.map(r => r.json()));
      
      const allSuccess = dataResults.every(r => r.success);
      
      if (allSuccess) {
        fetchPeminjaman();
        setSelectedItems([]);
        alert(`${selectedItems.length} data berhasil dihapus`);
      } else {
        alert('Beberapa data gagal dihapus');
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menghapus data');
    }
  };

  const handleApprove = async (id, status) => {
    try {
      const response = await fetch(`/api/admin/peminjaman/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();
      if (data.success) {
        fetchPeminjaman();
        alert(status === 'disetujui' ? 'Peminjaman berhasil disetujui' : 'Peminjaman berhasil ditolak');
      } else {
        alert(data.message || 'Terjadi kesalahan');
      }
    } catch (error) {
      alert('Terjadi kesalahan');
    }
  };

  // Filter peminjaman berdasarkan search query
  const filteredPeminjaman = useMemo(() => {
    if (!searchQuery.trim()) return peminjaman;
    const query = searchQuery.toLowerCase();
    return peminjaman.filter(p => 
      p.peminjam_nama?.toLowerCase().includes(query) ||
      p.alat_nama?.toLowerCase().includes(query) ||
      p.status?.toLowerCase().includes(query) ||
      p.id.toString().includes(query)
    );
  }, [peminjaman, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredPeminjaman.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPeminjaman = filteredPeminjaman.slice(startIndex, endIndex);

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
        <Header user={user} title="CRUD Peminjaman" />
        <main className="flex-1 p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">CRUD Peminjaman</h1>
                <p className="text-gray-600">Kelola data peminjaman alat</p>
              </div>
              <button
                onClick={() => {
                  setEditingPeminjaman(null);
                  setFormData({
                    peminjam_id: '',
                    alat_id: '',
                    jumlah: 1,
                    tanggal_pinjam: '',
                    tanggal_kembali: '',
                    status: 'pending',
                    keterangan: '',
                  });
                  setShowModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                + Tambah Peminjaman
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
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

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <span className="mr-2">📝</span>
                  Daftar Peminjaman
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
                          checked={paginatedPeminjaman.length > 0 && selectedItems.length === paginatedPeminjaman.length}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Peminjam</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Alat</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Jumlah</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tgl Pinjam</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tgl Kembali</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedPeminjaman.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-4xl mb-2">📦</span>
                            <p className="text-sm text-gray-500">
                              {searchQuery ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data peminjaman'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      paginatedPeminjaman.map((p) => (
                        <tr key={p.id} className={`hover:bg-blue-50/50 transition-colors ${selectedItems.includes(p.id) ? 'bg-blue-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(p.id)}
                              onChange={() => handleSelectItem(p.id)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.peminjam_nama}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.alat_nama}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{p.jumlah}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {p.tanggal_pinjam ? new Date(p.tanggal_pinjam).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {p.tanggal_kembali ? new Date(p.tanggal_kembali).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                              p.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              p.status === 'disetujui' ? 'bg-green-100 text-green-800' :
                              p.status === 'ditolak' ? 'bg-red-100 text-red-800' :
                              p.status === 'dipinjam' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2 flex-wrap">
                              {p.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApprove(p.id, 'disetujui')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-xs"
                                  >
                                    ✓ Setujui
                                  </button>
                                  <button
                                    onClick={() => handleApprove(p.id, 'ditolak')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold shadow-sm hover:shadow-md text-xs"
                                  >
                                    ✕ Tolak
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {filteredPeminjaman.length > 0 && (
              <div className="mt-6 px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-2xl">
                <div className="text-sm text-gray-600 font-medium">
                  Menampilkan {startIndex + 1} - {Math.min(endIndex, filteredPeminjaman.length)} dari {filteredPeminjaman.length} data
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
                    {editingPeminjaman ? 'Edit Peminjaman' : 'Tambah Peminjaman'}
                  </h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Peminjam</label>
                    <select
                      value={formData.peminjam_id}
                      onChange={(e) => setFormData({ ...formData, peminjam_id: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Pilih Peminjam</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nama} ({u.username})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Alat</label>
                    <select
                      value={formData.alat_id}
                      onChange={(e) => setFormData({ ...formData, alat_id: e.target.value })}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="">Pilih Alat</option>
                      {alat.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nama} (Tersedia: {a.jumlah})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Jumlah</label>
                    <input
                      type="number"
                      value={formData.jumlah}
                      onChange={(e) => setFormData({ ...formData, jumlah: parseInt(e.target.value) })}
                      required
                      min="1"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tanggal Pinjam</label>
                    <input
                      type="date"
                      value={formData.tanggal_pinjam}
                      onChange={(e) => setFormData({ ...formData, tanggal_pinjam: e.target.value })}
                      required
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="pending">Pending</option>
                      <option value="disetujui">Disetujui</option>
                      <option value="ditolak">Ditolak</option>
                      <option value="dipinjam">Dipinjam</option>
                      <option value="dikembalikan">Dikembalikan</option>
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
                        setEditingPeminjaman(null);
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
          </div>
        </main>
      </div>
    </div>
  );
}

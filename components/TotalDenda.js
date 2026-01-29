'use client';

import { useEffect, useState } from 'react';

export default function TotalDenda({ user }) {
  const [totalDenda, setTotalDenda] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    fetchTotalDenda();
    const interval = setInterval(fetchTotalDenda, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [user]);

  const fetchTotalDenda = async () => {
    try {
      const response = await fetch('/api/admin/denda');
      const data = await response.json();
      if (data.success) {
        setTotalDenda(data.totalDenda);
      }
    } catch (error) {
      console.error('Error fetching total denda:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-md">
      <span className="text-white text-lg">💰</span>
      <div className="flex flex-col">
        <span className="text-xs text-green-100 font-medium">Total Denda</span>
        {loading ? (
          <span className="text-white text-sm font-semibold">...</span>
        ) : (
          <span className="text-white text-sm font-bold">
            Rp {Number(totalDenda).toLocaleString('id-ID')}
          </span>
        )}
      </div>
    </div>
  );
}

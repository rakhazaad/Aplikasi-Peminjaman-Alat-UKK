'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        document.cookie = `token=${data.token}; path=/; max-age=604800`; // 7 days
        router.push('/');
        router.refresh();
      } else {
        setError(data.message || 'Login gagal');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Welcome Section */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 overflow-hidden">
        {/* Cloud decoration */}
        <div className="absolute right-0 top-0 bottom-0 w-32">
          <svg className="h-full w-full" viewBox="0 0 200 800" preserveAspectRatio="none">
            <path
              d="M0,0 Q50,100 0,200 T0,400 T0,600 T0,800 L0,800 L200,800 L200,0 Z"
              fill="white"
              opacity="0.9"
            />
            <path
              d="M0,100 Q60,150 0,250 T0,450 T0,650 T0,800 L0,800 L200,800 L200,100 Z"
              fill="white"
              opacity="0.7"
            />
            <path
              d="M0,200 Q40,250 0,350 T0,550 T0,750 T0,800 L0,800 L200,800 L200,200 Z"
              fill="white"
              opacity="0.5"
            />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-center items-center px-12 text-white">
          <div className="mb-8">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-2xl mb-6">
              <svg
                viewBox="0 0 200 200"
                className="w-24 h-24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Person 1 - Giving tool */}
                <g transform="translate(30, 60)">
                  {/* Head */}
                  <circle cx="20" cy="15" r="12" fill="#3B82F6" />
                  {/* Body */}
                  <rect x="10" y="27" width="20" height="30" rx="5" fill="#3B82F6" />
                  {/* Arms - giving position */}
                  <rect x="5" y="30" width="6" height="20" rx="3" fill="#3B82F6" transform="rotate(-20 8 40)" />
                  <rect x="29" y="30" width="6" height="20" rx="3" fill="#3B82F6" transform="rotate(20 32 40)" />
                  {/* Tool in hand */}
                  <rect x="32" y="35" width="8" height="12" rx="2" fill="#10B981" />
                  <rect x="35" y="30" width="2" height="8" fill="#10B981" />
                </g>

                {/* Person 2 - Receiving tool */}
                <g transform="translate(120, 60)">
                  {/* Head */}
                  <circle cx="20" cy="15" r="12" fill="#3B82F6" />
                  {/* Body */}
                  <rect x="10" y="27" width="20" height="30" rx="5" fill="#3B82F6" />
                  {/* Arms - receiving position */}
                  <rect x="5" y="30" width="6" height="20" rx="3" fill="#3B82F6" transform="rotate(20 8 40)" />
                  <rect x="29" y="30" width="6" height="20" rx="3" fill="#3B82F6" transform="rotate(-20 32 40)" />
                  {/* Tool in hand */}
                  <rect x="0" y="35" width="8" height="12" rx="2" fill="#10B981" />
                  <rect x="3" y="30" width="2" height="8" fill="#10B981" />
                </g>

                {/* Connection line/arrow between them */}
                <path
                  d="M 80 80 Q 100 60 120 80"
                  stroke="#10B981"
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#10B981" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>

          <h2 className="text-4xl font-bold mb-4 text-center">Welcome to</h2>
          <h1 className="text-5xl font-bold mb-6 text-center">Peminjaman Alat</h1>
          <p className="text-lg text-blue-100 text-center max-w-md leading-relaxed">
            Masuk ke akun Anda untuk mengakses fitur lengkap dan tetap terhubung dengan sistem peminjaman alat. Bergabunglah dengan komunitas kami dan nikmati pengalaman yang mudah dan efisien!
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Masuk ke Akun</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Masukkan username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Masukkan password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-b from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 text-sm text-center text-gray-600">
            <p>
              Belum punya akun?{' '}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                Daftar di sini
              </Link>
            </p>
          </div>

          <div className="mt-4 text-sm text-gray-500 text-center">
          </div>

          {/* Mobile logo - shown only on small screens */}
          <div className="lg:hidden mt-8 flex justify-center">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
              <svg
                viewBox="0 0 200 200"
                className="w-16 h-16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Person 1 - Giving tool */}
                <g transform="translate(30, 60)">
                  <circle cx="20" cy="15" r="12" fill="white" />
                  <rect x="10" y="27" width="20" height="30" rx="5" fill="white" />
                  <rect x="5" y="30" width="6" height="20" rx="3" fill="white" transform="rotate(-20 8 40)" />
                  <rect x="29" y="30" width="6" height="20" rx="3" fill="white" transform="rotate(20 32 40)" />
                  <rect x="32" y="35" width="8" height="12" rx="2" fill="#10B981" />
                  <rect x="35" y="30" width="2" height="8" fill="#10B981" />
                </g>

                {/* Person 2 - Receiving tool */}
                <g transform="translate(120, 60)">
                  <circle cx="20" cy="15" r="12" fill="white" />
                  <rect x="10" y="27" width="20" height="30" rx="5" fill="white" />
                  <rect x="5" y="30" width="6" height="20" rx="3" fill="white" transform="rotate(20 8 40)" />
                  <rect x="29" y="30" width="6" height="20" rx="3" fill="white" transform="rotate(-20 32 40)" />
                  <rect x="0" y="35" width="8" height="12" rx="2" fill="#10B981" />
                  <rect x="3" y="30" width="2" height="8" fill="#10B981" />
                </g>

                <path
                  d="M 80 80 Q 100 60 120 80"
                  stroke="#10B981"
                  strokeWidth="3"
                  fill="none"
                  markerEnd="url(#arrowhead-mobile)"
                />
                <defs>
                  <marker
                    id="arrowhead-mobile"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#10B981" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

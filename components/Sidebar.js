'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useMobileMenu } from '@/contexts/MobileMenuContext';

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const { isMobileMenuOpen, closeMobileMenu } = useMobileMenu();

  // Helper function to update content margins
  const updateContentMargins = (sidebarWidth) => {
    // Find elements with ml-64 or ml-20 classes and update their margin
    // Try multiple approaches to find elements
    
    // Approach 1: Query by class name (most reliable)
    try {
      const elementsWithMl64 = document.querySelectorAll('.ml-64');
      const elementsWithMl20 = document.querySelectorAll('.ml-20');
      
      [...elementsWithMl64, ...elementsWithMl20].forEach(el => {
        el.style.marginLeft = sidebarWidth;
        el.style.transition = 'margin-left 0.3s ease';
      });
    } catch (e) {
      console.warn('Error querying by class:', e);
    }
    
    // Approach 2: Search all elements for class names containing ml-64 or ml-20
    try {
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        if (el.className && typeof el.className === 'string') {
          const classList = el.className;
          // Check for exact class matches using word boundaries
          const hasMl64 = /\bml-64\b/.test(classList);
          const hasMl20 = /\bml-20\b/.test(classList);
          
          if (hasMl64 || hasMl20) {
            el.style.marginLeft = sidebarWidth;
            el.style.transition = 'margin-left 0.3s ease';
          }
        } else if (el.classList) {
          // Use classList API if available
          if (el.classList.contains('ml-64') || el.classList.contains('ml-20')) {
            el.style.marginLeft = sidebarWidth;
            el.style.transition = 'margin-left 0.3s ease';
          }
        }
      });
    } catch (e) {
      console.warn('Error searching all elements:', e);
    }
  };

  // Load sidebar state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState !== null) {
      const isOpenState = savedState === 'true';
      setIsOpen(isOpenState);
      // Initialize margin on mount
      const sidebarWidth = isOpenState ? '256px' : '80px';
      document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
      // Update margins after delays to ensure DOM is ready
      setTimeout(() => {
        updateContentMargins(sidebarWidth);
      }, 100);
      setTimeout(() => {
        updateContentMargins(sidebarWidth);
      }, 300);
      setTimeout(() => {
        updateContentMargins(sidebarWidth);
      }, 500);
    } else {
      // Default: open sidebar
      const sidebarWidth = '256px';
      document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
      setTimeout(() => {
        updateContentMargins(sidebarWidth);
      }, 100);
      setTimeout(() => {
        updateContentMargins(sidebarWidth);
      }, 300);
      setTimeout(() => {
        updateContentMargins(sidebarWidth);
      }, 500);
    }
  }, []);

  // Update localStorage and content margin when sidebar state changes
  useEffect(() => {
    localStorage.setItem('sidebarOpen', isOpen.toString());
    
    // Update CSS variable for dynamic margin (for custom CSS)
    const sidebarWidth = isOpen ? '256px' : '80px';
    document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
    
    // Update all content areas with dynamic margin-left using inline style
    // Use multiple delays to ensure DOM is ready
    requestAnimationFrame(() => {
      updateContentMargins(sidebarWidth);
      // Also update after a short delay to catch any late-rendered elements
      setTimeout(() => {
        updateContentMargins(sidebarWidth);
      }, 50);
      setTimeout(() => {
        updateContentMargins(sidebarWidth);
      }, 200);
    });
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      // Call logout API to log the activity
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error logging logout:', error);
    } finally {
      // Clear token and redirect regardless of logging success
      document.cookie = 'token=; path=/; max-age=0';
      router.push('/login');
    }
  };

  const menuItems = [];

  if (user?.role === 'admin') {
    menuItems.push(
      { href: '/', label: 'Dashboard', icon: '📊' },
      { href: '/admin/users', label: 'CRUD User', icon: '👥' },
      { href: '/admin/alat', label: 'CRUD Alat', icon: '🔧' },
      { href: '/admin/kategori', label: 'CRUD Kategori', icon: '📁' },
      { href: '/admin/peminjaman', label: 'CRUD Peminjaman', icon: '📝' },
      { href: '/admin/pengembalian', label: 'CRUD Pengembalian', icon: '↩️' },
      { href: '/admin/log', label: 'Log Aktifitas', icon: '📋' }
    );
  } else if (user?.role === 'petugas') {
    menuItems.push(
      { href: '/', label: 'Dashboard', icon: '📊' },
      { href: '/petugas/approve', label: 'Setujui Peminjaman', icon: '✅' },
      { href: '/petugas/monitor', label: 'Pantau Pengembalian', icon: '👀' },
      { href: '/petugas/laporan', label: 'Cetak Laporan', icon: '📄' }
    );
  } else if (user?.role === 'peminjam') {
    menuItems.push(
      { href: '/', label: 'Dashboard', icon: '📊' },
      { href: '/peminjam/alat', label: 'Daftar Alat', icon: '🔧' },
      { href: '/peminjam/pinjam', label: 'Ajukan Peminjaman', icon: '📝' },
      { href: '/peminjam/kembali', label: 'Kembalikan Alat', icon: '↩️' }
    );
  }

  // Determine background color based on role
  const sidebarBg = (user?.role === 'peminjam' || user?.role === 'petugas' || user?.role === 'admin')
    ? 'bg-gradient-to-b from-blue-600 via-blue-500 to-blue-700' 
    : 'bg-gray-800';
  
  const hoverBg = (user?.role === 'peminjam' || user?.role === 'petugas' || user?.role === 'admin')
    ? 'hover:bg-white/10 hover:backdrop-blur-sm'
    : 'hover:bg-gray-700';
  
  const activeBg = (user?.role === 'peminjam' || user?.role === 'petugas' || user?.role === 'admin')
    ? 'bg-white/20 backdrop-blur-sm border-l-4 border-white/50 shadow-lg'
    : 'bg-gray-700 border-l-4 border-blue-500';

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      {/* Overlay untuk mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
          onClick={closeMobileMenu}
        />
      )}
      <div className={`${sidebarBg} text-white fixed left-0 top-0 h-screen transition-all duration-300 shadow-2xl flex flex-col z-[50] ${
        isOpen ? 'w-64' : 'w-20'
      } ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
      {/* Logo/Brand Section */}
      <div className={`${isOpen ? 'p-6' : 'p-4'} border-b border-white/10 flex-shrink-0`}>
        <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
          {isOpen && (
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h2 className="font-bold text-lg leading-tight">Menu</h2>
                <p className="text-xs text-white/70">Navigation</p>
              </div>
            </div>
          )}
          {!isOpen && (
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          )}
          {isOpen && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 ${(user?.role === 'peminjam' || user?.role === 'petugas' || user?.role === 'admin') ? 'hover:bg-white/10' : 'hover:bg-gray-700'} rounded-lg transition-all duration-200 ml-2`}
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {!isOpen && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-2 ${(user?.role === 'peminjam' || user?.role === 'petugas' || user?.role === 'admin') ? 'hover:bg-white/10' : 'hover:bg-gray-700'} rounded-lg transition-all duration-200`}
              aria-label="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className={`${isOpen ? 'p-4' : 'p-2'} space-y-2 flex-1 overflow-y-auto`}>
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center ${isOpen ? 'px-4 py-3' : 'px-2 py-3 justify-center'} rounded-xl ${hoverBg} transition-all duration-200 group ${
              pathname === item.href ? activeBg : ''
            }`}
            title={!isOpen ? item.label : ''}
            onClick={closeMobileMenu}
          >
            <span className={`text-2xl ${isOpen ? 'mr-4' : ''} flex-shrink-0`}>{item.icon}</span>
            {isOpen && (
              <span className={`font-medium transition-all whitespace-nowrap ${pathname === item.href ? 'text-white' : 'text-white/90 group-hover:text-white'}`}>
                {item.label}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* User Profile */}
      <div className={`${isOpen ? 'px-4 py-3' : 'px-2 py-3'} border-t border-white/10 flex-shrink-0`}>
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold ${isOpen ? '' : 'mx-auto'}`}>
            {(user?.nama || user?.username || '?').charAt(0).toUpperCase()}
          </div>
          {isOpen && (
            <div className="leading-tight">
              <p className="text-sm font-semibold text-white truncate">{user?.nama || user?.username || 'Pengguna'}</p>
              <p className="text-xs text-white/70 capitalize truncate">{user?.role || 'role'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Logout Button */}
      <div className={`${isOpen ? 'p-4' : 'p-2'} border-t border-white/10 flex-shrink-0`}>
        <button
          onClick={() => {
            closeMobileMenu();
            handleLogout();
          }}
          className={`w-full flex items-center ${isOpen ? 'px-4 py-3' : 'px-2 py-3 justify-center'} rounded-xl ${
            (user?.role === 'peminjam' || user?.role === 'petugas' || user?.role === 'admin')
              ? 'bg-red-600/80 hover:bg-red-600 text-white' 
              : 'bg-red-700/80 hover:bg-red-700 text-white'
          } transition-all duration-200 group`}
          title={!isOpen ? 'Keluar' : ''}
        >
          <span className={`text-2xl ${isOpen ? 'mr-4' : ''} flex-shrink-0`}>🚪</span>
          {isOpen && <span className="font-medium whitespace-nowrap">Keluar</span>}
        </button>
      </div>
    </div>
    </>
  );
}

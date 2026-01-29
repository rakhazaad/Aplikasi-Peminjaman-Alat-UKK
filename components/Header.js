'use client';

import NotificationBell from './NotificationBell';
import TotalDenda from './TotalDenda';
import { useMobileMenu } from '@/contexts/MobileMenuContext';

export default function Header({ user, title, actions }) {
  const { toggleMobileMenu } = useMobileMenu();
  const headerBg = user?.role === 'peminjam' 
    ? 'bg-white shadow-md border-b border-blue-100' 
    : 'bg-white shadow-sm border-b border-gray-200';
  
  const titleColor = user?.role === 'peminjam'
    ? 'text-blue-700'
    : 'text-gray-800';

  return (
    <div className={`${headerBg} sticky top-0 z-[41]`}>
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center w-full">
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
          {/* Hamburger Button untuk Mobile */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className={`text-lg sm:text-xl md:text-2xl font-bold ${titleColor} truncate`}>{title || 'Dashboard'}</h1>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-shrink-0">
          {actions}
          {user?.role === 'admin' && <TotalDenda user={user} />}
          <NotificationBell user={user} />
        </div>
      </div>
    </div>
  );
}

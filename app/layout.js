import './globals.css'
import { Inter } from 'next/font/google'
import { MobileMenuProvider } from '@/contexts/MobileMenuContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Aplikasi Peminjaman Alat',
  description: 'Sistem manajemen peminjaman alat',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <MobileMenuProvider>
          {children}
        </MobileMenuProvider>
      </body>
    </html>
  )
}

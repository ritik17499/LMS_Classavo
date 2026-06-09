import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LMS',
  description: 'Learning Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        {/*
          Providers is a client component that fires the silent refresh on mount.
          Everything beneath it can use the Zustand auth store once initialised.
        */}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

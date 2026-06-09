'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'

function NavBar() {
  const { user } = useAuth()
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const router = useRouter()

  async function handleLogout() {
    try { await api.post('/auth/logout/') } catch { /* ignore */ }
    clearAuth()
    router.replace('/login')
  }

  return (
    <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
      <div className="flex items-center gap-6">
        <Link href="/student/catalog" className="text-base font-semibold text-gray-900">
          LMS
        </Link>
        <Link href="/student/catalog" className="text-sm text-gray-600 hover:text-gray-900">
          Catalog
        </Link>
        <Link href="/student/courses" className="text-sm text-gray-600 hover:text-gray-900">
          My courses
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{user?.fullName}</span>
        <Button variant="ghost" onClick={handleLogout} className="text-xs">
          Sign out
        </Button>
      </div>
    </nav>
  )
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const { isInitialised, isAuthenticated, isStudent } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isInitialised) return
    if (!isAuthenticated) { router.replace('/login'); return }
    if (!isStudent) router.replace('/instructor/courses')
  }, [isInitialised, isAuthenticated, isStudent, router])

  if (!isInitialised || !isAuthenticated || !isStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
    </div>
  )
}

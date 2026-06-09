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
      <Link href="/instructor/courses" className="text-base font-semibold text-gray-900">
        LMS — Instructor
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{user?.fullName}</span>
        <Button variant="ghost" onClick={handleLogout} className="text-xs">
          Sign out
        </Button>
      </div>
    </nav>
  )
}

/**
 * Guards all /instructor/* routes.
 * Waits for token initialisation, then redirects non-instructors.
 */
export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const { isInitialised, isAuthenticated, isInstructor } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isInitialised) return
    if (!isAuthenticated) { router.replace('/login'); return }
    if (!isInstructor) router.replace('/student/catalog')
  }, [isInitialised, isAuthenticated, isInstructor, router])

  if (!isInitialised || !isAuthenticated || !isInstructor) {
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

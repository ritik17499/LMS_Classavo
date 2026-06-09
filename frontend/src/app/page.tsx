'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui/Spinner'

/**
 * Root page — acts as a router once auth state is initialised.
 * Shows a spinner while the silent token refresh is in-flight.
 */
export default function RootPage() {
  const { isInitialised, isAuthenticated, isInstructor } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isInitialised) return
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }
    router.replace(isInstructor ? '/instructor/courses' : '/student/catalog')
  }, [isInitialised, isAuthenticated, isInstructor, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner />
    </div>
  )
}

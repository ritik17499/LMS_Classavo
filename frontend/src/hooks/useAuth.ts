'use client'

import { useAuthStore } from '@/store/authStore'

/** Convenience hook — exposes derived auth state consumed by layouts and components. */
export function useAuth() {
  const { accessToken, user, isInitialised } = useAuthStore()

  return {
    isAuthenticated: !!accessToken,
    isInitialised,
    user,
    role: user?.role ?? null,
    isInstructor: user?.role === 'INSTRUCTOR',
    isStudent: user?.role === 'STUDENT',
  }
}

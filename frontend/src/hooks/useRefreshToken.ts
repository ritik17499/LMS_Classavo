'use client'

import { useCallback } from 'react'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { parseJwt } from '@/lib/utils'

const _apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const BASE_URL = _apiUrl.startsWith('http') ? _apiUrl : `https://${_apiUrl}`

/**
 * Silently exchanges the httpOnly refresh-token cookie for a new access token.
 * Called once on app mount (inside Providers) to re-hydrate the Zustand store
 * after a page reload without forcing the user to log in again.
 *
 * Returns true if the refresh succeeded, false otherwise.
 */
export function useRefreshToken() {
  const { setAuth, clearAuth, setInitialised } = useAuthStore()

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const { data } = await axios.post(
        `${BASE_URL}/api/auth/token/refresh/`,
        {},
        { withCredentials: true },
      )
      const payload = parseJwt(data.access)
      setAuth(data.access, {
        id: payload.user_id,
        email: payload.email,
        fullName: payload.full_name,
        role: payload.role,
      })
      return true
    } catch {
      clearAuth()
      return false
    } finally {
      // Always mark initialised so layouts stop showing their loading spinner
      setInitialised()
    }
  }, [setAuth, clearAuth, setInitialised])

  return { refresh }
}

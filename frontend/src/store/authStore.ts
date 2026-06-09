/**
 * Zustand auth store.
 *
 * Access token lives in memory only — evaporates on tab close, invisible to
 * localStorage-sniffing XSS. The refresh token lives in an httpOnly cookie
 * managed entirely by the browser; this store never sees it.
 *
 * isInitialised: false until the first silent-refresh attempt resolves.
 * Protected layouts wait for this flag before making redirect decisions to
 * avoid a flash-redirect on first load when the token hasn't been restored yet.
 */

import { create } from 'zustand'
import { AuthUser } from '@/types'

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  isInitialised: boolean
  setAuth: (token: string, user: AuthUser) => void
  clearAuth: () => void
  setInitialised: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isInitialised: false,

  setAuth: (token, user) => set({ accessToken: token, user }),
  clearAuth: () => set({ accessToken: null, user: null }),
  setInitialised: () => set({ isInitialised: true }),
}))

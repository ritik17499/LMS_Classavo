'use client'

import { useEffect, useRef } from 'react'
import { useRefreshToken } from '@/hooks/useRefreshToken'

/**
 * Client-side provider tree.
 *
 * On first mount, attempts a silent token refresh. This re-hydrates the
 * Zustand auth store from the httpOnly refresh-token cookie after a page reload,
 * so users don't need to re-authenticate just because they refreshed the tab.
 *
 * useRef prevents the refresh from running twice in React StrictMode
 * (which double-invokes effects in development to surface side-effect bugs).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const { refresh } = useRefreshToken()
  const hasRun = useRef(false)

  useEffect(() => {
    if (hasRun.current) return
    hasRun.current = true
    refresh()
  }, [refresh])

  return <>{children}</>
}

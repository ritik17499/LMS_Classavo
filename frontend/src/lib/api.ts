/**
 * Axios instance pre-configured for the LMS API.
 *
 * Request interceptor  — attaches the Bearer token from the Zustand store.
 * Response interceptor — on 401, silently refreshes the access token (reads
 *                        the httpOnly refresh cookie) and retries the original
 *                        request once. A retry queue prevents duplicate refresh
 *                        calls when multiple concurrent requests 401 at once.
 */

import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios'
import { useAuthStore } from '@/store/authStore'

const _apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const BASE_URL = _apiUrl.startsWith('http') ? _apiUrl : `https://${_apiUrl}`

const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`,
  // Required for the httpOnly refresh-token cookie to be sent cross-origin
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor ───────────────────────────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — silent token refresh ───────────────────────────────

let isRefreshing = false
let pendingQueue: Array<(token: string) => void> = []

function drainQueue(newToken: string) {
  pendingQueue.forEach((resolve) => resolve(newToken))
  pendingQueue = []
}

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean }

    if (error.response?.status !== 401 || original._retried) {
      return Promise.reject(error)
    }

    // If a refresh is already in-flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingQueue.push((token) => {
          original.headers.Authorization = `Bearer ${token}`
          resolve(api(original))
        })
      })
    }

    original._retried = true
    isRefreshing = true

    try {
      // Use a plain axios call (not `api`) to avoid triggering this interceptor again
      const { data } = await axios.post(
        `${BASE_URL}/api/auth/token/refresh/`,
        {},
        { withCredentials: true },
      )
      const newToken: string = data.access
      const currentUser = useAuthStore.getState().user
      if (currentUser) {
        useAuthStore.getState().setAuth(newToken, currentUser)
      }
      drainQueue(newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch {
      useAuthStore.getState().clearAuth()
      pendingQueue = []
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      return Promise.reject(error)
    } finally {
      isRefreshing = false
    }
  },
)

export default api

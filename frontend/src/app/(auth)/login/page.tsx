'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { LoginForm } from '@/components/auth/LoginForm'
import { parseJwt } from '@/lib/utils'

const _apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const BASE_URL = _apiUrl.startsWith('http') ? _apiUrl : `https://${_apiUrl}`

export default function LoginPage() {
  const router = useRouter()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(email: string, password: string) {
    setLoading(true)
    setError(null)
    try {
      // Bypass the api instance here to avoid the auth interceptor on a public endpoint
      const { data } = await axios.post(
        `${BASE_URL}/api/auth/login/`,
        { email, password },
        { withCredentials: true },
      )
      const payload = parseJwt(data.access)
      setAuth(data.access, {
        id: payload.user_id,
        email: payload.email,
        fullName: payload.full_name,
        role: payload.role,
      })
      router.replace(payload.role === 'INSTRUCTOR' ? '/instructor/courses' : '/student/catalog')
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err)
          ? err.response?.data?.detail ?? 'Login failed. Check your credentials.'
          : 'An unexpected error occurred.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Sign in to LMS</h1>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <LoginForm onSubmit={handleLogin} loading={loading} />
        <p className="mt-5 text-center text-sm text-gray-500">
          No account?{' '}
          <a href="/register" className="text-blue-600 hover:underline">
            Register
          </a>
        </p>
      </div>
    </div>
  )
}

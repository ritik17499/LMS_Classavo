'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { UserRole } from '@/types'

const _apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
const BASE_URL = _apiUrl.startsWith('http') ? _apiUrl : `https://${_apiUrl}`

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleRegister(fields: {
    email: string
    first_name: string
    last_name: string
    role: UserRole
    password: string
    password_confirm: string
  }) {
    setLoading(true)
    setError(null)
    try {
      await axios.post(`${BASE_URL}/api/auth/register/`, fields)
      router.replace('/login')
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data
        const firstMessage = data
          ? Object.values(data).flat().join(' ')
          : 'Registration failed.'
        setError(firstMessage as string)
      } else {
        setError('An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-gray-900">Create an account</h1>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <RegisterForm onSubmit={handleRegister} loading={loading} />
        <p className="mt-5 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}

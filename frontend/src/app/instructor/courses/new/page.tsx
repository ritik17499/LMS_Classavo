'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { CourseForm } from '@/components/courses/CourseForm'

export default function NewCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: { title: string; description: string }) {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.post('/courses/', values)
      router.replace(`/instructor/courses/${data.id}`)
    } catch {
      setError('Failed to create course.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          onClick={() => router.back()}
          className="mb-2 text-sm text-blue-600 hover:underline"
        >
          ← Back
        </button>
        <h1 className="text-xl font-semibold text-gray-900">New Course</h1>
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <CourseForm onSubmit={handleSubmit} loading={loading} submitLabel="Create course" />
    </div>
  )
}

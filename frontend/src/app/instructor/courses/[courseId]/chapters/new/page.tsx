'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/lib/api'
import { ChapterForm, ChapterFormValues } from '@/components/courses/ChapterForm'

export default function NewChapterPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(values: ChapterFormValues) {
    setLoading(true)
    setError(null)
    try {
      await api.post('/chapters/', { ...values, course: Number(courseId) })
      router.replace(`/instructor/courses/${courseId}`)
    } catch {
      setError('Failed to create chapter. Check that the content is a valid document.')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button onClick={() => router.back()} className="mb-2 text-sm text-blue-600 hover:underline">
          ← Back to course
        </button>
        <h1 className="text-xl font-semibold text-gray-900">New Chapter</h1>
      </div>
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <ChapterForm onSubmit={handleSubmit} loading={loading} submitLabel="Create chapter" />
    </div>
  )
}

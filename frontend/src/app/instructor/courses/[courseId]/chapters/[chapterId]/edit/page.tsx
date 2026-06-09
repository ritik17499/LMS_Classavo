'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/lib/api'
import { Chapter } from '@/types'
import { ChapterForm, ChapterFormValues } from '@/components/courses/ChapterForm'
import { Spinner } from '@/components/ui/Spinner'

export default function EditChapterPage() {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>()
  const router = useRouter()
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<Chapter>(`/chapters/${chapterId}/`)
      .then(({ data }) => setChapter(data))
      .catch(() => setFetchError('Failed to load chapter.'))
  }, [chapterId])

  async function handleSubmit(values: ChapterFormValues) {
    setLoading(true)
    setSaveError(null)
    try {
      await api.patch(`/chapters/${chapterId}/`, {
        ...values,
        course: Number(courseId),
      })
      router.replace(`/instructor/courses/${courseId}`)
    } catch {
      setSaveError('Failed to save chapter. Check that the content is valid.')
      setLoading(false)
    }
  }

  if (fetchError) return <p className="text-sm text-red-600">{fetchError}</p>
  if (!chapter) return <Spinner className="mx-auto mt-12" />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button onClick={() => router.back()} className="mb-2 text-sm text-blue-600 hover:underline">
          ← Back to course
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Edit Chapter</h1>
      </div>
      {saveError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError}
        </p>
      )}
      <ChapterForm
        initialValues={{
          title: chapter.title,
          content: chapter.content,
          is_public: chapter.is_public,
          order: chapter.order,
        }}
        onSubmit={handleSubmit}
        loading={loading}
        submitLabel="Save changes"
      />
    </div>
  )
}

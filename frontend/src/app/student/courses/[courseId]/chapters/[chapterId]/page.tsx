'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/lib/api'
import { ChapterRead } from '@/types'
import { PlateViewer } from '@/components/editor/PlateViewer'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'

export default function StudentChapterPage() {
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>()
  const router = useRouter()
  const [chapter, setChapter] = useState<ChapterRead | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<ChapterRead>(`/chapters/${chapterId}/`)
      .then(({ data }) => setChapter(data))
      .catch(() => setError('This chapter could not be loaded.'))
      .finally(() => setLoading(false))
  }, [chapterId])

  if (loading) return <Spinner className="mx-auto mt-12" />
  if (error) return <p className="text-sm text-red-600">{error}</p>

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button
          onClick={() => router.push(`/student/courses/${courseId}`)}
          className="mb-2 text-sm text-blue-600 hover:underline"
        >
          ← Back to course
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{chapter?.title}</h1>
        {chapter && (
          <p className="mt-0.5 text-xs text-gray-400">
            Last updated {formatDate(chapter.updated_at)}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white px-6 py-5">
        {chapter && <PlateViewer content={chapter.content} />}
      </div>
    </div>
  )
}

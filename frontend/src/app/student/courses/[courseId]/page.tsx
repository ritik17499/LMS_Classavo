'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/lib/api'
import { Course, ChapterRead } from '@/types'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'

export default function StudentCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [chapters, setChapters] = useState<ChapterRead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Course>(`/courses/${courseId}/`),
      api.get<{ results: ChapterRead[] }>(`/courses/${courseId}/chapters/`),
    ])
      .then(([courseRes, chaptersRes]) => {
        setCourse(courseRes.data)
        setChapters(chaptersRes.data.results)
      })
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) return <Spinner className="mx-auto mt-12" />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button onClick={() => router.back()} className="mb-2 text-sm text-blue-600 hover:underline">
          ← My courses
        </button>
        <h1 className="text-xl font-semibold text-gray-900">{course?.title}</h1>
        {course?.description && (
          <p className="mt-1 text-sm text-gray-500">{course.description}</p>
        )}
      </div>

      <h2 className="text-base font-medium text-gray-700">
        Chapters ({chapters.length})
      </h2>

      {chapters.length === 0 && (
        <p className="text-sm text-gray-500">No public chapters available yet.</p>
      )}

      <div className="flex flex-col gap-2">
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            onClick={() =>
              router.push(`/student/courses/${courseId}/chapters/${chapter.id}`)
            }
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50"
          >
            <p className="text-sm font-medium text-gray-800">{chapter.title}</p>
            <span className="text-xs text-gray-400">{formatDate(chapter.updated_at)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

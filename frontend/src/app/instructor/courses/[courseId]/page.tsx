'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import api from '@/lib/api'
import { Course, Chapter } from '@/types'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'

export default function InstructorCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get<Course>(`/courses/${courseId}/`),
      api.get<{ results: Chapter[] }>(`/courses/${courseId}/chapters/`),
    ])
      .then(([courseRes, chaptersRes]) => {
        setCourse(courseRes.data)
        setChapters(chaptersRes.data.results)
      })
      .finally(() => setLoading(false))
  }, [courseId])

  async function handleDeleteChapter(chapterId: number) {
    if (!confirm('Delete this chapter?')) return
    await api.delete(`/chapters/${chapterId}/`)
    setChapters((prev) => prev.filter((c) => c.id !== chapterId))
  }

  if (loading) return <Spinner className="mx-auto mt-12" />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <button onClick={() => router.back()} className="mb-2 text-sm text-blue-600 hover:underline">
          ← My courses
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{course?.title}</h1>
            {course?.description && (
              <p className="mt-1 text-sm text-gray-500">{course.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium text-gray-700">
          Chapters ({chapters.length})
        </h2>
        <Button onClick={() => router.push(`/instructor/courses/${courseId}/chapters/new`)}>
          + New chapter
        </Button>
      </div>

      {chapters.length === 0 && (
        <p className="text-sm text-gray-500">No chapters yet.</p>
      )}

      <div className="flex flex-col gap-2">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-gray-800">{chapter.title}</p>
              <p className="text-xs text-gray-400">
                Order {chapter.order} ·{' '}
                <span className={chapter.is_public ? 'text-green-600' : 'text-amber-600'}>
                  {chapter.is_public ? 'Public' : 'Private'}
                </span>{' '}
                · {formatDate(chapter.updated_at)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="text-xs"
                onClick={() =>
                  router.push(
                    `/instructor/courses/${courseId}/chapters/${chapter.id}/edit`,
                  )
                }
              >
                Edit
              </Button>
              <Button
                variant="danger"
                className="text-xs"
                onClick={() => handleDeleteChapter(chapter.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

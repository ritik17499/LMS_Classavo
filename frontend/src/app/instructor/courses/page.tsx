'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Course } from '@/types'
import { CourseCard } from '@/components/courses/CourseCard'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

export default function InstructorCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<{ results: Course[] }>('/courses/')
      .then(({ data }) => setCourses(data.results))
      .catch(() => setError('Failed to load courses.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(courseId: number) {
    if (!confirm('Delete this course and all its chapters?')) return
    await api.delete(`/courses/${courseId}/`)
    setCourses((prev) => prev.filter((c) => c.id !== courseId))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">My Courses</h1>
        <Button onClick={() => router.push('/instructor/courses/new')}>+ New course</Button>
      </div>

      {loading && <Spinner className="mx-auto" />}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && courses.length === 0 && (
        <p className="text-sm text-gray-500">No courses yet. Create your first one.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            action={{
              label: 'Manage',
              onClick: () => router.push(`/instructor/courses/${course.id}`),
            }}
            secondaryAction={{
              label: 'Delete',
              variant: 'danger',
              onClick: () => handleDelete(course.id),
            }}
          />
        ))}
      </div>
    </div>
  )
}

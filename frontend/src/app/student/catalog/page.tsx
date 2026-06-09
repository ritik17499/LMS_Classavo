'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Course } from '@/types'
import { CourseCard } from '@/components/courses/CourseCard'
import { EnrollButton } from '@/components/courses/EnrollButton'
import { Spinner } from '@/components/ui/Spinner'

export default function CatalogPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [enrolledIds, setEnrolledIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    Promise.all([
      api.get<{ results: Course[] }>('/courses/catalog/'),
      api.get<{ results: { course: number }[] }>('/enrollments/'),
    ]).then(([catalogRes, enrollRes]) => {
      setCourses(catalogRes.data.results)
      setEnrolledIds(new Set(enrollRes.data.results.map((e) => e.course)))
    }).finally(() => setLoading(false))
  }, [])

  function markEnrolled(courseId: number) {
    setEnrolledIds((prev) => new Set([...prev, courseId]))
  }

  if (loading) return <Spinner className="mx-auto mt-12" />

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">Course Catalog</h1>
      {courses.length === 0 && (
        <p className="text-sm text-gray-500">No courses available yet.</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <div key={course.id} className="flex flex-col gap-2">
            <CourseCard
              course={course}
              action={
                enrolledIds.has(course.id)
                  ? {
                      label: 'Go to course',
                      onClick: () => router.push(`/student/courses/${course.id}`),
                    }
                  : undefined
              }
            />
            {!enrolledIds.has(course.id) && (
              <EnrollButton
                courseId={course.id}
                onEnrolled={() => markEnrolled(course.id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { Course } from '@/types'
import { CourseCard } from '@/components/courses/CourseCard'
import { Spinner } from '@/components/ui/Spinner'

export default function StudentCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<{ results: Course[] }>('/courses/')
      .then(({ data }) => setCourses(data.results))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner className="mx-auto mt-12" />

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-gray-900">My Courses</h1>
      {courses.length === 0 && (
        <p className="text-sm text-gray-500">
          You haven't joined any courses yet.{' '}
          <a href="/student/catalog" className="text-blue-600 hover:underline">
            Browse the catalog
          </a>
          .
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            action={{
              label: 'Open',
              onClick: () => router.push(`/student/courses/${course.id}`),
            }}
          />
        ))}
      </div>
    </div>
  )
}

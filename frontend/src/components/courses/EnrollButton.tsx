'use client'

import { useState } from 'react'
import api from '@/lib/api'
import { Button } from '@/components/ui/Button'

interface EnrollButtonProps {
  courseId: number
  onEnrolled: () => void
}

/**
 * Posts to /api/enrollments/ to join a course.
 * Calls onEnrolled() so the parent catalog can refresh or navigate.
 */
export function EnrollButton({ courseId, onEnrolled }: EnrollButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleEnroll() {
    setLoading(true)
    setError(null)
    try {
      await api.post('/enrollments/', { course: courseId })
      onEnrolled()
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { course?: string[] } } }).response?.data?.course?.[0] === 'string'
      ) {
        setError(
          (err as { response: { data: { course: string[] } } }).response.data.course[0],
        )
      } else {
        setError('Could not enroll. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button onClick={handleEnroll} loading={loading}>
        Join course
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

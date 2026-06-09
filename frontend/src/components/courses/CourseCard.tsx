import { Course } from '@/types'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface CourseCardProps {
  course: Course
  /** Primary action button label and handler */
  action?: { label: string; onClick: () => void; loading?: boolean }
  /** Secondary action (e.g. Edit, Delete) */
  secondaryAction?: { label: string; onClick: () => void; variant?: 'danger' | 'ghost' }
}

export function CourseCard({ course, action, secondaryAction }: CourseCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{course.title}</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {course.chapter_count} chapter{course.chapter_count !== 1 ? 's' : ''} ·{' '}
            {formatDate(course.created_at)}
          </p>
        </div>
        {secondaryAction && (
          <Button
            variant={secondaryAction.variant ?? 'ghost'}
            onClick={secondaryAction.onClick}
            className="shrink-0 text-xs"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
      {course.description && (
        <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
      )}
      {action && (
        <Button
          variant="primary"
          onClick={action.onClick}
          loading={action.loading}
          className="mt-auto self-start"
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

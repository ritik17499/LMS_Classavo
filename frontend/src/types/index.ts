// ── Domain types ──────────────────────────────────────────────────────────────

export type UserRole = 'INSTRUCTOR' | 'STUDENT'

export interface AuthUser {
  id: number
  email: string
  fullName: string
  role: UserRole
}

/** Shape of the decoded JWT access token payload. */
export interface JwtPayload {
  user_id: number
  email: string
  full_name: string
  role: UserRole
  exp: number
  iat: number
}

export interface Course {
  id: number
  title: string
  description: string
  owner_email: string
  chapter_count: number
  created_at: string
  updated_at: string
}

/** Full chapter — returned to instructors (includes is_public, course FK). */
export interface Chapter {
  id: number
  course: number
  title: string
  content: SlateNode[]
  is_public: boolean
  order: number
  created_at: string
  updated_at: string
}

/** Read-only chapter — returned to students (subset of fields). */
export interface ChapterRead {
  id: number
  title: string
  content: SlateNode[]
  order: number
  updated_at: string
}

export interface Enrollment {
  id: number
  student: AuthUser
  course: number
  course_title: string
  status: 'ACTIVE' | 'DROPPED' | 'PENDING'
  enrolled_at: string
  dropped_at: string | null
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// ── Slate / Plate types ───────────────────────────────────────────────────────

/**
 * Slate text leaf — must have a `text` key, no `children`.
 * Additional keys represent marks (bold, italic, etc.).
 */
export interface SlateText {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  [key: string]: unknown
}

/**
 * Slate element node — must have `type` + `children`, no `text`.
 */
export interface SlateElement {
  type: string
  children: SlateNode[]
  [key: string]: unknown
}

export type SlateNode = SlateText | SlateElement

/** The minimal valid Plate.js document (a single empty paragraph). */
export const EMPTY_SLATE_DOCUMENT: SlateNode[] = [
  { type: 'p', children: [{ text: '' }] },
]

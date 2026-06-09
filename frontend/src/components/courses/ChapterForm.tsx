'use client'

/**
 * Chapter create/edit form used by the instructor workspace.
 *
 * The Plate.js rich-text editor is embedded directly so that the form owns
 * the complete chapter state (title + content + metadata) in one component.
 * The parent page is responsible for the API call and navigation.
 */

import { useState, FormEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PlateEditor } from '@/components/editor/PlateEditor'
import { SlateNode, EMPTY_SLATE_DOCUMENT } from '@/types'

export interface ChapterFormValues {
  title: string
  content: SlateNode[]
  is_public: boolean
  order: number
}

interface ChapterFormProps {
  initialValues?: Partial<ChapterFormValues>
  onSubmit: (values: ChapterFormValues) => Promise<void>
  loading: boolean
  submitLabel?: string
}

export function ChapterForm({
  initialValues,
  onSubmit,
  loading,
  submitLabel = 'Save chapter',
}: ChapterFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [content, setContent] = useState<SlateNode[]>(
    initialValues?.content ?? EMPTY_SLATE_DOCUMENT,
  )
  const [isPublic, setIsPublic] = useState(initialValues?.is_public ?? false)
  const [order, setOrder] = useState(initialValues?.order ?? 0)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ title, content, is_public: isPublic, order })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex gap-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Chapter 1: Getting Started"
          className="flex-1"
        />
        <Input
          label="Order"
          type="number"
          min={0}
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          className="w-24"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Content</label>
        {/*
          key={initialValues?.title} remounts the editor when navigating between
          chapters so it always reflects the loaded chapter's content.
        */}
        <PlateEditor
          key={initialValues?.title ?? 'new'}
          initialValue={initialValues?.content}
          onChange={setContent}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 accent-blue-600"
        />
        Visible to enrolled students
      </label>

      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  )
}

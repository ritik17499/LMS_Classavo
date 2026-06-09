'use client'

import { useState, FormEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface CourseFormValues {
  title: string
  description: string
}

interface CourseFormProps {
  initialValues?: Partial<CourseFormValues>
  onSubmit: (values: CourseFormValues) => Promise<void>
  loading: boolean
  submitLabel?: string
}

export function CourseForm({
  initialValues,
  onSubmit,
  loading,
  submitLabel = 'Save course',
}: CourseFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit({ title, description })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="Introduction to Machine Learning"
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="A brief overview of what students will learn…"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </form>
  )
}

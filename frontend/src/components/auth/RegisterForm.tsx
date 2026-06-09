'use client'

import { useState, FormEvent } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { UserRole } from '@/types'

interface RegisterFormProps {
  onSubmit: (fields: {
    email: string
    first_name: string
    last_name: string
    role: UserRole
    password: string
    password_confirm: string
  }) => Promise<void>
  loading: boolean
}

export function RegisterForm({ onSubmit, loading }: RegisterFormProps) {
  const [fields, setFields] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'STUDENT' as UserRole,
    password: '',
    password_confirm: '',
  })

  function set(key: string, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    onSubmit(fields)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First name"
          value={fields.first_name}
          onChange={(e) => set('first_name', e.target.value)}
          required
          placeholder="Jane"
        />
        <Input
          label="Last name"
          value={fields.last_name}
          onChange={(e) => set('last_name', e.target.value)}
          required
          placeholder="Doe"
        />
      </div>
      <Input
        label="Email"
        type="email"
        value={fields.email}
        onChange={(e) => set('email', e.target.value)}
        required
        placeholder="you@example.com"
      />
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">I am a</label>
        <div className="flex gap-4">
          {(['STUDENT', 'INSTRUCTOR'] as UserRole[]).map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="role"
                value={r}
                checked={fields.role === r}
                onChange={() => set('role', r)}
                className="accent-blue-600"
              />
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </label>
          ))}
        </div>
      </div>
      <Input
        label="Password"
        type="password"
        value={fields.password}
        onChange={(e) => set('password', e.target.value)}
        required
        placeholder="••••••••"
      />
      <Input
        label="Confirm password"
        type="password"
        value={fields.password_confirm}
        onChange={(e) => set('password_confirm', e.target.value)}
        required
        placeholder="••••••••"
      />
      <Button type="submit" loading={loading} className="mt-2 w-full">
        Create account
      </Button>
    </form>
  )
}

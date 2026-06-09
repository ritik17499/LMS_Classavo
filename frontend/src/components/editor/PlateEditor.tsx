'use client'

import { useMemo } from 'react'
import {
  Plate,
  PlateContent,
  useEditorRef,
  toggleMark,
  toggleNodeType,
  isMarkActive,
  someNode,
} from '@udecode/plate-common'
import {
  MARK_BOLD,
  MARK_ITALIC,
  MARK_UNDERLINE,
  createBoldPlugin,
  createItalicPlugin,
  createUnderlinePlugin,
} from '@udecode/plate-basic-marks'
import { ELEMENT_H1, ELEMENT_H2, ELEMENT_H3, createHeadingPlugin } from '@udecode/plate-heading'
import { ELEMENT_BLOCKQUOTE, createBlockquotePlugin } from '@udecode/plate-block-quote'
import { ELEMENT_CODE_BLOCK, createCodeBlockPlugin } from '@udecode/plate-code-block'
import { cn } from '@/lib/utils'
import { SlateNode, EMPTY_SLATE_DOCUMENT } from '@/types'

interface PlateEditorProps {
  initialValue?: SlateNode[]
  onChange: (value: SlateNode[]) => void
}

// ── Toolbar ────────────────────────────────────────────────────────────────────

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault()
        onClick()
      }}
      className={cn(
        'rounded px-2 py-1 text-sm font-medium transition-colors',
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-100',
      )}
    >
      {children}
    </button>
  )
}

function EditorToolbar() {
  const editor = useEditorRef()

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1">
      <ToolbarButton
        active={isMarkActive(editor, MARK_BOLD)}
        onClick={() => toggleMark(editor, { key: MARK_BOLD })}
        title="Bold (⌘B)"
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        active={isMarkActive(editor, MARK_ITALIC)}
        onClick={() => toggleMark(editor, { key: MARK_ITALIC })}
        title="Italic (⌘I)"
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        active={isMarkActive(editor, MARK_UNDERLINE)}
        onClick={() => toggleMark(editor, { key: MARK_UNDERLINE })}
        title="Underline (⌘U)"
      >
        <span className="underline">U</span>
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-gray-300" />

      {([
        { type: ELEMENT_H1, label: 'H1' },
        { type: ELEMENT_H2, label: 'H2' },
        { type: ELEMENT_H3, label: 'H3' },
      ] as const).map(({ type, label }) => (
        <ToolbarButton
          key={type}
          active={someNode(editor, { match: { type } })}
          onClick={() => toggleNodeType(editor, { activeType: type })}
          title={label}
        >
          {label}
        </ToolbarButton>
      ))}

      <div className="mx-1 h-4 w-px bg-gray-300" />

      <ToolbarButton
        active={someNode(editor, { match: { type: ELEMENT_BLOCKQUOTE } })}
        onClick={() => toggleNodeType(editor, { activeType: ELEMENT_BLOCKQUOTE })}
        title="Blockquote"
      >
        ❝
      </ToolbarButton>
      <ToolbarButton
        active={someNode(editor, { match: { type: ELEMENT_CODE_BLOCK } })}
        onClick={() => toggleNodeType(editor, { activeType: ELEMENT_CODE_BLOCK })}
        title="Code block"
      >
        {'</>'}
      </ToolbarButton>
    </div>
  )
}

// ── Editor ─────────────────────────────────────────────────────────────────────

export function PlateEditor({ initialValue, onChange }: PlateEditorProps) {
  const plugins = useMemo(
    () => [
      createBoldPlugin(),
      createItalicPlugin(),
      createUnderlinePlugin(),
      createHeadingPlugin(),
      createBlockquotePlugin(),
      createCodeBlockPlugin(),
    ],
    [],
  )

  return (
    <Plate
      plugins={plugins}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialValue={(initialValue?.length ? initialValue : EMPTY_SLATE_DOCUMENT) as any}
      onValueChange={(value) => onChange(value as SlateNode[])}
    >
      <div className="overflow-hidden rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500">
        <EditorToolbar />
        <PlateContent
          className="min-h-[320px] px-4 py-3 text-sm outline-none prose prose-sm max-w-none"
          placeholder="Write your chapter content here…"
        />
      </div>
    </Plate>
  )
}

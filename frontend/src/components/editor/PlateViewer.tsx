'use client'

import { useMemo } from 'react'
import { Plate, PlateContent } from '@udecode/plate-common'
import { createBoldPlugin, createItalicPlugin, createUnderlinePlugin } from '@udecode/plate-basic-marks'
import { createHeadingPlugin } from '@udecode/plate-heading'
import { createBlockquotePlugin } from '@udecode/plate-block-quote'
import { createCodeBlockPlugin } from '@udecode/plate-code-block'
import { SlateNode, EMPTY_SLATE_DOCUMENT } from '@/types'

interface PlateViewerProps {
  content: SlateNode[]
}

export function PlateViewer({ content }: PlateViewerProps) {
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
      initialValue={(content?.length ? content : EMPTY_SLATE_DOCUMENT) as any}
    >
      <PlateContent
        readOnly
        className="prose prose-sm max-w-none text-sm outline-none"
      />
    </Plate>
  )
}

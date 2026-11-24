/**
 * Markdown → Tiptap JSON (Workflow §47 — markdown support).
 *
 * Counterpart to tiptapMarkdown.ts: parses the common Markdown subset
 * the Ien editor produces back into a document. Used for pasting plain
 * Markdown into the editor and for importing .md files.
 */

interface TiptapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  text?: string
}

const INLINE_PATTERN =
  /(\*\*([^*]+)\*\*)|(\*([^*\n]+)\*)|(~~([^~]+)~~)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)\s]+)\))|(!\[([^\]]*)\]\(([^)\s]+)\))/g

function parseInline(text: string): TiptapNode[] {
  const nodes: TiptapNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  INLINE_PATTERN.lastIndex = 0
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push({ type: 'text', text: text.slice(last, match.index) })
    }
    if (match[1]) {
      nodes.push({ type: 'text', text: match[2], marks: [{ type: 'bold' }] })
    } else if (match[3]) {
      nodes.push({ type: 'text', text: match[4], marks: [{ type: 'italic' }] })
    } else if (match[5]) {
      nodes.push({ type: 'text', text: match[6], marks: [{ type: 'strike' }] })
    } else if (match[7]) {
      nodes.push({ type: 'text', text: match[8], marks: [{ type: 'code' }] })
    } else if (match[9]) {
      nodes.push({
        type: 'text',
        text: match[10],
        marks: [{ type: 'link', attrs: { href: match[11] } }],
      })
    } else if (match[12]) {
      nodes.push({ type: 'image', attrs: { alt: match[13], src: match[14] } })
    }
    last = INLINE_PATTERN.lastIndex
  }
  if (last < text.length) {
    nodes.push({ type: 'text', text: text.slice(last) })
  }
  return nodes.filter((node) => node.type !== 'text' || (node.text ?? '').length > 0)
}

function paragraph(text: string): TiptapNode {
  // Single newlines inside a paragraph become hard breaks.
  const lines = text.split('\n')
  const content: TiptapNode[] = []
  lines.forEach((line, index) => {
    if (index > 0) content.push({ type: 'hardBreak' })
    content.push(...parseInline(line))
  })
  if (!content.length) content.push({ type: 'text', text: '' })
  return { type: 'paragraph', content }
}

function isTableRow(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line)
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?(\s*:?-+:?\s*\|)+\s*$/.test(line)
}

function tableRowCells(line: string): TiptapNode {
  const cells = line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => ({ type: 'tableCell', content: [paragraph(cell.trim())] }))
  return { type: 'tableRow', content: cells }
}

/** Convert a Markdown string into a Tiptap `doc` node. */
export function markdownToTiptap(markdown: string): TiptapNode {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: TiptapNode[] = []

  let index = 0
  while (index < lines.length) {
    const line = lines[index]

    // Blank line — skip.
    if (!line.trim()) {
      index += 1
      continue
    }

    // Fenced code block.
    const fence = line.match(/^```(\w*)\s*$/)
    if (fence) {
      const language = fence[1] || ''
      const code: string[] = []
      index += 1
      while (index < lines.length && !/^```\s*$/.test(lines[index])) {
        code.push(lines[index])
        index += 1
      }
      index += 1 // closing fence (or EOF)
      blocks.push({
        type: 'codeBlock',
        attrs: { language },
        content: code.length ? [{ type: 'text', text: code.join('\n') }] : [],
      })
      continue
    }

    // Heading.
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      blocks.push({
        type: 'heading',
        attrs: { level: heading[1].length },
        content: parseInline(heading[2]),
      })
      index += 1
      continue
    }

    // Horizontal rule.
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push({ type: 'horizontalRule' })
      index += 1
      continue
    }

    // Blockquote (consecutive "> " lines).
    if (/^>\s?/.test(line)) {
      const quoted: string[] = []
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoted.push(lines[index].replace(/^>\s?/, ''))
        index += 1
      }
      blocks.push({
        type: 'blockquote',
        content: [paragraph(quoted.join('\n'))],
      })
      continue
    }

    // Table (header row + separator + body rows).
    if (isTableRow(line) && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const headerCells = tableRowCells(line)
      const columns = headerCells.content?.length ?? 0
      index += 2
      const rows: TiptapNode[] = [
        {
          type: 'tableRow',
          content: (headerCells.content ?? []).map((cell) => ({
            type: 'tableHeader',
            content: cell.content,
          })),
        },
      ]
      while (index < lines.length && isTableRow(lines[index])) {
        const row = tableRowCells(lines[index])
        // Pad short rows so the table stays rectangular.
        while ((row.content?.length ?? 0) < columns) {
          row.content?.push({ type: 'tableCell', content: [paragraph('')] })
        }
        rows.push(row)
        index += 1
      }
      blocks.push({ type: 'table', content: rows })
      continue
    }

    // Task list.
    if (/^\s*[-*+]\s+\[[ xX]\]\s+/.test(line)) {
      const items: TiptapNode[] = []
      while (index < lines.length && /^\s*[-*+]\s+\[[ xX]\]\s+/.test(lines[index])) {
        const checked = /\[[xX]\]/.test(lines[index])
        const text = lines[index].replace(/^\s*[-*+]\s+\[[ xX]\]\s+/, '')
        items.push({
          type: 'taskItem',
          attrs: { checked },
          content: [{ type: 'paragraph', content: parseInline(text) }],
        })
        index += 1
      }
      blocks.push({ type: 'taskList', content: items })
      continue
    }

    // Bullet list.
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: TiptapNode[] = []
      while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index]) && !/^\s*[-*+]\s+\[[ xX]\]/.test(lines[index])) {
        const text = lines[index].replace(/^\s*[-*+]\s+/, '')
        items.push({ type: 'listItem', content: [{ type: 'paragraph', content: parseInline(text) }] })
        index += 1
      }
      blocks.push({ type: 'bulletList', content: items })
      continue
    }

    // Ordered list.
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: TiptapNode[] = []
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
        const text = lines[index].replace(/^\s*\d+\.\s+/, '')
        items.push({ type: 'listItem', content: [{ type: 'paragraph', content: parseInline(text) }] })
        index += 1
      }
      blocks.push({ type: 'orderedList', content: items })
      continue
    }

    // Paragraph: accumulate until a blank line or a new block construct.
    const chunk: string[] = []
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,6}\s|```|>\s?|\s*[-*+]\s|\s*\d+\.\s)/.test(lines[index]) &&
      !isTableRow(lines[index])
    ) {
      chunk.push(lines[index])
      index += 1
    }
    if (chunk.length) {
      blocks.push(paragraph(chunk.join('\n')))
    } else {
      // Safety: never spin — consume the line as a paragraph.
      blocks.push(paragraph(lines[index]))
      index += 1
    }
  }

  if (!blocks.length) blocks.push({ type: 'paragraph' })
  return { type: 'doc', content: blocks }
}

/** Heuristic: does this plain-text paste look like Markdown? */
export function looksLikeMarkdown(text: string): boolean {
  return /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s+\S|\d+\.\s+\S|>\s|\|.*\|)|```|\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\n]+\)|!\[[^\]\n]*\]\([^)\n]+\)/.test(
    text,
  )
}

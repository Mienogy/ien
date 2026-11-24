/**
 * Tiptap JSON → Markdown (Workflow §47 — export/markdown support).
 * Handles the node/mark set produced by the Ien editor; unknown nodes
 * degrade to their text content instead of failing the export.
 */

interface TiptapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  text?: string
}

function renderInline(nodes: TiptapNode[] | undefined): string {
  if (!nodes) return ''
  return nodes.map(renderInlineNode).join('')
}

function renderInlineNode(node: TiptapNode): string {
  if (node.type === 'hardBreak') return '\n'
  if (node.type === 'image') {
    const alt = String(node.attrs?.alt ?? '')
    const src = String(node.attrs?.src ?? '')
    return `![${alt}](${src})`
  }

  let text = node.text ?? ''
  if (node.content) text += renderInline(node.content)

  for (const mark of node.marks ?? []) {
    switch (mark.type) {
      case 'bold':
        text = `**${text}**`
        break
      case 'italic':
        text = `*${text}*`
        break
      case 'strike':
        text = `~~${text}~~`
        break
      case 'code':
        text = `\`${text}\``
        break
      case 'link':
        text = `[${text}](${String(mark.attrs?.href ?? '')})`
        break
    }
  }
  return text
}

function renderListItem(item: TiptapNode, prefix: string): string {
  const lines: string[] = []
  let first = true
  for (const part of item.content ?? []) {
    if (part.type === 'paragraph') {
      const text = renderInline(part.content)
      lines.push(first ? prefix + text : `  ${text}`)
      first = false
    } else if (part.type === 'bulletList' || part.type === 'orderedList' || part.type === 'taskList') {
      lines.push(
        renderBlock(part)
          .split('\n')
          .map((line) => `  ${line}`)
          .join('\n'),
      )
      first = false
    } else {
      lines.push(`  ${renderBlock(part)}`)
      first = false
    }
  }
  if (!lines.length) lines.push(prefix.trimEnd())
  return lines.join('\n')
}

function renderTable(node: TiptapNode): string {
  const rows = (node.content ?? []).filter((r) => r.type === 'tableRow')
  if (!rows.length) return ''
  const cellText = (row: TiptapNode) =>
    (row.content ?? [])
      .map((cell) => renderInline(cell.content).replace(/\|/g, '\\|'))
      .join(' | ')
  const columns = rows[0].content?.length ?? 1
  const separator = `|${' --- |'.repeat(columns)}`
  const body = rows.map((row) => `| ${cellText(row)} |`)
  return [body[0], separator, ...body.slice(1)].join('\n')
}

function renderBlock(node: TiptapNode): string {
  switch (node.type) {
    case 'paragraph':
      return renderInline(node.content)
    case 'heading': {
      const level = Number(node.attrs?.level ?? 1)
      return `${'#'.repeat(Math.min(Math.max(level, 1), 6))} ${renderInline(node.content)}`
    }
    case 'bulletList':
      return (node.content ?? []).map((item) => renderListItem(item, '- ')).join('\n')
    case 'orderedList':
      return (node.content ?? [])
        .map((item, index) => renderListItem(item, `${index + 1}. `))
        .join('\n')
    case 'taskList':
      return (node.content ?? [])
        .map((item) =>
          renderListItem(item, item.attrs?.checked ? '- [x] ' : '- [ ] '),
        )
        .join('\n')
    case 'blockquote':
      return (renderBlocks(node.content) || renderInline(node.content))
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
    case 'codeBlock': {
      const language = String(node.attrs?.language ?? '')
      const code = (node.content ?? []).map((n) => n.text ?? '').join('')
      return `\`\`\`${language}\n${code}\n\`\`\``
    }
    case 'horizontalRule':
      return '---'
    case 'callout': {
      const body = renderBlocks(node.content) || renderInline(node.content)
      return body
        .split('\n')
        .map((line) => `> ${line}`)
        .join('\n')
    }
    case 'table':
      return renderTable(node)
    default:
      if (node.content) return renderBlocks(node.content)
      return renderInlineNode(node)
  }
}

function renderBlocks(nodes: TiptapNode[] | undefined): string {
  if (!nodes) return ''
  return nodes
    .map(renderBlock)
    .filter((block) => block.length > 0)
    .join('\n\n')
}

/** Convert a Tiptap document (or null/empty) to Markdown. */
export function tiptapToMarkdown(doc: unknown): string {
  if (!doc || typeof doc !== 'object') return ''
  const node = doc as TiptapNode
  if (node.type === 'doc') return renderBlocks(node.content)
  return renderBlocks([node])
}

import { marked } from 'marked'
import xss, { type IWhiteList } from 'xss'

marked.setOptions({ gfm: true })

const whiteList: IWhiteList = {
  p: [],
  br: [],
  strong: [],
  em: [],
  u: [],
  s: [],
  code: ['class'],
  pre: [],
  blockquote: [],
  ul: [],
  ol: [],
  li: [],
  h1: [],
  h2: [],
  h3: [],
  h4: [],
  h5: [],
  h6: [],
  a: ['href', 'title', 'rel'],
  hr: [],
  table: [],
  thead: [],
  tbody: [],
  tr: [],
  th: [],
  td: [],
}

export async function markdownToSafeHtml(markdown: string): Promise<string> {
  const raw = await marked.parse(markdown)
  const html = typeof raw === 'string' ? raw : ''
  return xss(html.trim(), {
    whiteList,
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style'],
    onTagAttr(tag, name, value) {
      if (tag === 'a' && name === 'href') {
        const lower = value.trim().toLowerCase()
        if (
          lower.startsWith('javascript:') ||
          lower.startsWith('data:')
        ) {
          return ''
        }
      }
      if (tag === 'a' && name === 'rel') {
        return 'rel="noopener noreferrer"'
      }
      return undefined
    },
  })
}

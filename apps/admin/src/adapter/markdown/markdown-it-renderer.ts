import MarkdownIt from 'markdown-it'
import type { MarkdownRenderer } from '../../port/markdown-renderer'

const md = new MarkdownIt('default', {
  html: false,
  linkify: true,
  breaks: false,
})

export const markdownItRenderer: MarkdownRenderer = {
  render(markdown: string): string {
    return md.render(markdown)
  },
}

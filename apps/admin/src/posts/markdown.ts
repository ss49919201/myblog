import MarkdownIt from 'markdown-it'

const md = new MarkdownIt('default', {
  html: false,
  linkify: true,
  breaks: false,
})

export function markdownToSafeHtml(markdown: string): string {
  return md.render(markdown).trim()
}

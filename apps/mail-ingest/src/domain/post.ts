import { err, ok, type Result } from 'neverthrow'
import type { IngestError } from './errors'

export const MAX_BODY_BYTES = 256 * 1024

export type PostDraft = {
  title: string
  slug: string
  publishedAt: Date
  body: string
}

function isInvalidSlug(slug: string): boolean {
  if (!slug || slug === '.' || slug === '..') {
    return true
  }
  return slug.includes('/') || slug.includes('\\') || slug.includes('\0')
}

export function validateSlug(slug: string): Result<string, IngestError> {
  if (isInvalidSlug(slug)) {
    return err({
      type: 'InvalidSlug',
      slug,
      detail: 'empty, ., .., /, \\, or NUL are not allowed',
    })
  }
  return ok(slug)
}

export function generateSlug(receivedAt: Date, id: string): string {
  const y = receivedAt.getUTCFullYear()
  const mo = String(receivedAt.getUTCMonth() + 1).padStart(2, '0')
  const d = String(receivedAt.getUTCDate()).padStart(2, '0')
  const short = id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toLowerCase()
  return `${y}${mo}${d}-${short || 'mail'}`
}

function yamlScalar(value: string): string {
  if (/[:#\n\r]/.test(value) || /^[\s-]/.test(value) || value.includes('"')) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  }
  return value
}

export function renderPostMarkdown(draft: PostDraft): string {
  const published = draft.publishedAt.toISOString()
  return `---\ntitle: ${yamlScalar(draft.title)}\nslug: ${yamlScalar(draft.slug)}\npublished_at: ${published}\n---\n\n${draft.body}`
}

export type BuildPostInput = {
  subject: string
  plainBody: string
  receivedAt: Date
  idSeed: string
}

export function buildPostDraft(input: BuildPostInput): Result<PostDraft, IngestError> {
  const title = input.subject.trim()
  if (!title) {
    return err({ type: 'Reject', reason: 'Subject is empty' })
  }

  if (new TextEncoder().encode(input.plainBody).byteLength > MAX_BODY_BYTES) {
    return err({
      type: 'MessageTooLarge',
      size: new TextEncoder().encode(input.plainBody).byteLength,
      limit: MAX_BODY_BYTES,
    })
  }

  const slug = generateSlug(input.receivedAt, input.idSeed)

  return validateSlug(slug).map((validSlug) => ({
    title,
    slug: validSlug,
    publishedAt: input.receivedAt,
    body: input.plainBody,
  }))
}

export function postFilePath(slug: string): string {
  return `content/posts/${slug}.md`
}

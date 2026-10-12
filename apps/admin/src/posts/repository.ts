import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import type { SubmitError } from './errors'
import { slugFromTitle, slugWithSuffix, isValidSlug } from './slug'
import { markdownToSafeHtml } from './markdown'

export type InsertPostInput = {
  title: string
  bodyMd: string
  publishedAt: Date
}

export type InsertedPost = {
  slug: string
  title: string
  publishedAt: Date
  bodyHtml: string
  bodyMd: string
}

async function slugExists(db: D1Database, slug: string): Promise<boolean> {
  const row = await db
    .prepare('SELECT 1 AS ok FROM posts WHERE slug = ?')
    .bind(slug)
    .first<{ ok: number }>()
  return row !== null
}

async function pickUniqueSlug(
  db: D1Database,
  title: string,
  publishedAt: Date,
): Promise<string> {
  const base = slugFromTitle(title, publishedAt)
  if (!isValidSlug(base)) {
    throw new Error(`generated invalid slug: ${base}`)
  }
  if (!(await slugExists(db, base))) {
    return base
  }
  for (let n = 2; n <= 50; n++) {
    const candidate = slugWithSuffix(base, n)
    if (!(await slugExists(db, candidate))) {
      return candidate
    }
  }
  const fallback = slugWithSuffix(base, publishedAt.getTime())
  return fallback
}

export function insertPost(
  db: D1Database,
  input: InsertPostInput,
): ResultAsync<InsertedPost, SubmitError> {
  const title = input.title.trim()
  const bodyMd = input.bodyMd.trim()
  if (title === '' || bodyMd === '') {
    return errAsync({
      type: 'ValidationError',
      message: 'タイトルと本文は必須です。',
    })
  }

  const bodyHtml = markdownToSafeHtml(bodyMd)
  const publishedAt = input.publishedAt

  return ResultAsync.fromPromise(
    pickUniqueSlug(db, title, publishedAt),
    (cause) => ({ type: 'StorageError', cause }) satisfies SubmitError,
  ).andThen((slug) =>
    ResultAsync.fromPromise(
      db
        .prepare(
          `INSERT INTO posts (slug, title, published_at, body_html, body_md)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          slug,
          title,
          publishedAt.toISOString(),
          bodyHtml,
          bodyMd,
        )
        .run(),
      (cause) => ({ type: 'StorageError', cause }) satisfies SubmitError,
    ).map(() => ({
      slug,
      title,
      publishedAt,
      bodyHtml,
      bodyMd,
    })),
  )
}

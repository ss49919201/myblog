import { errAsync, ResultAsync } from 'neverthrow'
import type { AdminError } from './errors'
import { markdownToSafeHtml } from './markdown'
import { ensureUniqueSlug, slugFromTitle } from './slug'

export type CreatePostInput = {
  title: string
  bodyMd: string
  publishedAt: Date
}

export type CreatedPost = {
  slug: string
  title: string
  publishedAt: Date
  bodyMd: string
  bodyHtml: string
}

export function validateCreateInput(
  title: string,
  bodyMd: string,
):
  | { ok: true; value: CreatePostInput }
  | { ok: false; error: AdminError } {
  const trimmedTitle = title.trim()
  if (trimmedTitle.length === 0) {
    return {
      ok: false,
      error: {
        type: 'ValidationError',
        field: 'title',
        message: 'タイトルを入力してください',
      },
    }
  }
  if (bodyMd.trim().length === 0) {
    return {
      ok: false,
      error: {
        type: 'ValidationError',
        field: 'body',
        message: '本文を入力してください',
      },
    }
  }
  return {
    ok: true,
    value: {
      title: trimmedTitle,
      bodyMd,
      publishedAt: new Date(),
    },
  }
}

export function createPost(
  db: D1Database,
  input: CreatePostInput,
): ResultAsync<CreatedPost, AdminError> {
  const baseSlug = slugFromTitle(input.title)
  return ResultAsync.fromPromise(ensureUniqueSlug(db, baseSlug), (cause) => ({
    type: 'StorageError',
    cause,
  } satisfies AdminError))
    .andThen((slug) =>
      ResultAsync.fromPromise(markdownToSafeHtml(input.bodyMd), (cause) => ({
        type: 'MarkdownError',
        cause,
      } satisfies AdminError)).andThen((bodyHtml) =>
        ResultAsync.fromPromise(
          db
            .prepare(
              `INSERT INTO posts (slug, title, published_at, body_html, body_md)
               VALUES (?, ?, ?, ?, ?)`,
            )
            .bind(
              slug,
              input.title,
              input.publishedAt.toISOString(),
              bodyHtml,
              input.bodyMd,
            )
            .run(),
          (cause) => ({ type: 'StorageError', cause }) satisfies AdminError,
        ).map(() => ({
          slug,
          title: input.title,
          publishedAt: input.publishedAt,
          bodyMd: input.bodyMd,
          bodyHtml,
        })),
      ),
    )
}

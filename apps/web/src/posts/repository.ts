import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import type { PostsError } from './errors'
import type { Post } from './types'

type PostRow = {
  slug: string
  title: string
  published_at: string
  body_html: string
}

function mapRow(row: PostRow): Post {
  return {
    slug: row.slug,
    title: row.title,
    publishedAt: new Date(row.published_at),
    bodyHtml: row.body_html,
  }
}

export function listPosts(db: D1Database): ResultAsync<Post[], PostsError> {
  return ResultAsync.fromPromise(
    db
      .prepare(
        'SELECT slug, title, published_at, body_html FROM posts ORDER BY published_at DESC',
      )
      .all<PostRow>(),
    (cause) => ({ type: 'StorageError', cause }) satisfies PostsError,
  ).map((response) => response.results.map(mapRow))
}

export function getPost(
  db: D1Database,
  slug: string,
): ResultAsync<Post, PostsError> {
  return ResultAsync.fromPromise(
    db
      .prepare(
        'SELECT slug, title, published_at, body_html FROM posts WHERE slug = ?',
      )
      .bind(slug)
      .first<PostRow>(),
    (cause) => ({ type: 'StorageError', cause }) satisfies PostsError,
  ).andThen((row) => {
    if (row === null) {
      return errAsync({ type: 'NotFound', slug } satisfies PostsError)
    }
    return okAsync(mapRow(row))
  })
}

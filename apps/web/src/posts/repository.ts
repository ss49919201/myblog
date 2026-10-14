import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import type { ReadOnlyD1 } from '../db/read-only-d1'
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

export function listPosts(db: ReadOnlyD1): ResultAsync<Post[], PostsError> {
  const prepared = db.prepare(
    'SELECT slug, title, published_at, body_html FROM posts ORDER BY published_at DESC',
  )
  if (prepared.isErr()) {
    return errAsync({ type: 'StorageError', cause: prepared.error })
  }

  return ResultAsync.fromPromise(
    prepared.value.all<PostRow>(),
    (cause) => ({ type: 'StorageError', cause }) satisfies PostsError,
  ).map((response) => response.results.map(mapRow))
}

export function getPost(
  db: ReadOnlyD1,
  slug: string,
): ResultAsync<Post, PostsError> {
  const prepared = db.prepare(
    'SELECT slug, title, published_at, body_html FROM posts WHERE slug = ?',
  )
  if (prepared.isErr()) {
    return errAsync({ type: 'StorageError', cause: prepared.error })
  }

  return ResultAsync.fromPromise(
    prepared.value.bind(slug).first<PostRow>(),
    (cause) => ({ type: 'StorageError', cause }) satisfies PostsError,
  ).andThen((row) => {
    if (row === null) {
      return errAsync({ type: 'NotFound', slug } satisfies PostsError)
    }
    return okAsync(mapRow(row))
  })
}

import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import type { ReadOnlyKysely } from '../db/read-only-kysely'
import type { Database } from '../db/schema'
import type { PostsError } from './errors'
import type { Post } from './types'

function mapRow(row: {
  slug: string
  title: string
  published_at: string
  body_html: string
}): Post {
  return {
    slug: row.slug,
    title: row.title,
    publishedAt: new Date(row.published_at),
    bodyHtml: row.body_html,
  }
}

export function listPosts(
  db: ReadOnlyKysely<Database>,
): ResultAsync<Post[], PostsError> {
  return ResultAsync.fromPromise(
    db
      .selectFrom('posts')
      .select(['slug', 'title', 'published_at', 'body_html'])
      .orderBy('published_at', 'desc')
      .execute(),
    (cause) => ({ type: 'StorageError', cause }) satisfies PostsError,
  ).map((rows) => rows.map(mapRow))
}

export function getPost(
  db: ReadOnlyKysely<Database>,
  slug: string,
): ResultAsync<Post, PostsError> {
  return ResultAsync.fromPromise(
    db
      .selectFrom('posts')
      .select(['slug', 'title', 'published_at', 'body_html'])
      .where('slug', '=', slug)
      .executeTakeFirst(),
    (cause) => ({ type: 'StorageError', cause }) satisfies PostsError,
  ).andThen((row) => {
    if (row === undefined) {
      return errAsync({ type: 'NotFound', slug } satisfies PostsError)
    }
    return okAsync(mapRow(row))
  })
}

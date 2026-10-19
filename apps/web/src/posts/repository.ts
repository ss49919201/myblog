import { desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import { posts } from '../db/schema'
import type { PostsError } from './errors'
import type { Post } from './types'

type PostRow = typeof posts.$inferSelect

function mapRow(row: PostRow): Post {
  return {
    slug: row.slug,
    title: row.title,
    publishedAt: new Date(row.publishedAt),
    bodyHtml: row.bodyHtml,
  }
}

function storageError(cause: unknown): PostsError {
  return { type: 'StorageError', cause }
}

export function listPosts(db: D1Database): ResultAsync<Post[], PostsError> {
  return ResultAsync.fromPromise(
    drizzle(db).select().from(posts).orderBy(desc(posts.publishedAt)),
    storageError,
  ).map((rows) => rows.map(mapRow))
}

export function getPost(
  db: D1Database,
  slug: string,
): ResultAsync<Post, PostsError> {
  return ResultAsync.fromPromise(
    drizzle(db).select().from(posts).where(eq(posts.slug, slug)).limit(1),
    storageError,
  ).andThen((rows) => {
    const row = rows[0]
    if (!row) return errAsync({ type: 'NotFound', slug } satisfies PostsError)
    return okAsync(mapRow(row))
  })
}

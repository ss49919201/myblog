import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { okAsync, ResultAsync } from 'neverthrow'
import { siteSettings } from '../db/schema'
import type { PostsError } from '../posts/errors'
import { DEFAULT_SITE_TITLE } from './default'

function storageError(cause: unknown): PostsError {
  return { type: 'StorageError', cause }
}

export function getSiteTitle(db: D1Database): ResultAsync<string, PostsError> {
  return ResultAsync.fromPromise(
    drizzle(db)
      .select({ siteTitle: siteSettings.siteTitle })
      .from(siteSettings)
      .where(eq(siteSettings.id, 1))
      .limit(1),
    storageError,
  ).andThen((rows) => okAsync(rows[0]?.siteTitle ?? DEFAULT_SITE_TITLE))
}

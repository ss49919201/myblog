import { describe, expect, it } from 'vitest'
import type { ReadOnlyKysely } from '../../src/db/read-only-kysely'
import type { Database } from '../../src/db/schema'
import { getPost, listPosts } from '../../src/posts/repository'

type PostRow = {
  slug: string
  title: string
  published_at: string
  body_html: string
}

function fakeReadOnlyDb(rows: PostRow[]): ReadOnlyKysely<Database> {
  const chain = {
    select: () => ({
      orderBy: () => ({
        execute: async () => rows,
      }),
      where: () => ({
        executeTakeFirst: async () =>
          rows.find((row) => row.slug === 'hello') ?? undefined,
      }),
    }),
  }
  return {
    selectFrom: () => chain,
    with: () => {
      throw new Error('not used in tests')
    },
  } as unknown as ReadOnlyKysely<Database>
}

describe('posts repository', () => {
  const row: PostRow = {
    slug: 'hello',
    title: 'Hello',
    published_at: '2026-01-01T00:00:00.000Z',
    body_html: '<p>hi</p>',
  }

  it('listPosts maps rows', async () => {
    const result = await listPosts(fakeReadOnlyDb([row]))
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value[0]?.slug).toBe('hello')
      expect(result.value[0]?.publishedAt).toEqual(
        new Date('2026-01-01T00:00:00.000Z'),
      )
    }
  })

  it('getPost returns NotFound when missing', async () => {
    const result = await getPost(fakeReadOnlyDb([]), 'missing')
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('NotFound')
    }
  })
})

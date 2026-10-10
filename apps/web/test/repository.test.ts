import { describe, expect, it } from 'vitest'
import { getPost, listPosts } from '../src/posts/repository'
import { createMockD1, seedPostRows } from './mock-d1'

describe('posts repository', () => {
  const db = createMockD1(seedPostRows)

  it('listPosts returns Ok with posts sorted newest first', async () => {
    const result = await listPosts(db)
    expect(result.isOk()).toBe(true)
    if (!result.isOk()) return
    expect(result.value.length).toBeGreaterThan(0)
    expect(result.value[0]?.slug).toBe('hello-hono')
  })

  it('getPost returns Ok for an existing slug', async () => {
    const result = await getPost(db, 'hello-hono')
    expect(result.isOk()).toBe(true)
    if (!result.isOk()) return
    expect(result.value.title).toBe('Hono JSX で SSR を始める')
  })

  it('getPost returns NotFound for a missing slug', async () => {
    const result = await getPost(db, 'does-not-exist')
    expect(result.isErr()).toBe(true)
    if (!result.isErr()) return
    expect(result.error).toEqual({ type: 'NotFound', slug: 'does-not-exist' })
  })

  it('listPosts returns StorageError when the database fails', async () => {
    const failingDb = createMockD1(seedPostRows, { fail: true })
    const result = await listPosts(failingDb)
    expect(result.isErr()).toBe(true)
    if (!result.isErr()) return
    expect(result.error.type).toBe('StorageError')
  })

  it('getPost returns StorageError when the database fails', async () => {
    const failingDb = createMockD1(seedPostRows, { fail: true })
    const result = await getPost(failingDb, 'hello-hono')
    expect(result.isErr()).toBe(true)
    if (!result.isErr()) return
    expect(result.error.type).toBe('StorageError')
  })
})

import { env } from 'cloudflare:test'
import { afterEach, describe, expect, it } from 'vitest'
import { getPost, listPosts } from '../src/posts/repository'
import {
  helloHonoRow,
  insertPost,
  mockDataLayerRow,
  recreatePostsTable,
} from './db-helpers'

describe('posts repository', () => {
  afterEach(async () => {
    await recreatePostsTable()
  })

  it('listPosts returns Ok with posts sorted newest first', async () => {
    await insertPost(mockDataLayerRow)
    await insertPost(helloHonoRow)
    const result = await listPosts(env.DB)
    expect(result.isOk()).toBe(true)
    if (!result.isOk()) return
    expect(result.value[0]?.slug).toBe('hello-hono')
  })

  it('getPost returns Ok for an existing slug', async () => {
    await insertPost(helloHonoRow)
    const result = await getPost(env.DB, 'hello-hono')
    expect(result.isOk()).toBe(true)
    if (!result.isOk()) return
    expect(result.value.title).toBe('Hono JSX で SSR を始める')
  })

  it('getPost returns NotFound for a missing slug', async () => {
    const result = await getPost(env.DB, 'does-not-exist')
    expect(result.isErr()).toBe(true)
    if (!result.isErr()) return
    expect(result.error).toEqual({ type: 'NotFound', slug: 'does-not-exist' })
  })

  it('listPosts returns StorageError when the posts table is missing', async () => {
    await env.DB.prepare('DROP TABLE posts').run()
    const result = await listPosts(env.DB)
    expect(result.isErr()).toBe(true)
    if (!result.isErr()) return
    expect(result.error.type).toBe('StorageError')
  })

  it('getPost returns StorageError when the posts table is missing', async () => {
    await env.DB.prepare('DROP TABLE posts').run()
    const result = await getPost(env.DB, 'hello-hono')
    expect(result.isErr()).toBe(true)
    if (!result.isErr()) return
    expect(result.error.type).toBe('StorageError')
  })
})

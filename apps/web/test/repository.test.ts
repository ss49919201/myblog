import { describe, expect, it } from 'vitest'
import { getPost, listPosts } from '../src/posts/repository'

describe('posts repository', () => {
  it('listPosts returns Ok with posts sorted newest first', () => {
    const result = listPosts()
    expect(result.isOk()).toBe(true)
    if (!result.isOk()) return
    expect(result.value.length).toBeGreaterThan(0)
    expect(result.value[0]?.slug).toBe('hello-hono')
  })

  it('getPost returns Ok for an existing slug', () => {
    const result = getPost('hello-hono')
    expect(result.isOk()).toBe(true)
    if (!result.isOk()) return
    expect(result.value.title).toBe('Hono JSX で SSR を始める')
  })

  it('getPost returns NotFound for a missing slug', () => {
    const result = getPost('does-not-exist')
    expect(result.isErr()).toBe(true)
    if (!result.isErr()) return
    expect(result.error).toEqual({ type: 'NotFound', slug: 'does-not-exist' })
  })
})

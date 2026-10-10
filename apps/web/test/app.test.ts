import { describe, expect, it } from 'vitest'
import app from '../src/app'

describe('blog routes', () => {
  it('GET / returns 200 and lists posts newest first', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('記事一覧')
    expect(html).toContain('Hono JSX で SSR を始める')
    const firstIndex = html.indexOf('Hono JSX で SSR を始める')
    const secondIndex = html.indexOf('リポジトリ関数の裏にモックを置く')
    expect(firstIndex).toBeGreaterThan(-1)
    expect(secondIndex).toBeGreaterThan(firstIndex)
  })

  it('GET /posts/:slug returns 200 for an existing post', async () => {
    const res = await app.request('/posts/hello-hono')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('Hono JSX で SSR を始める')
    expect(html).toContain('Cloudflare Workers 上で Hono の JSX を使い')
  })

  it('GET /posts/:slug returns 404 for a missing post', async () => {
    const res = await app.request('/posts/does-not-exist')
    expect(res.status).toBe(404)
    const html = await res.text()
    expect(html).toContain('ページが見つかりません')
  })
})

import { env, SELF } from 'cloudflare:test'
import { afterEach, describe, expect, it } from 'vitest'
import {
  helloHonoRow,
  insertPost,
  mockDataLayerRow,
  recreatePostsTable,
} from './db-helpers'

describe('blog routes', () => {
  it('GET / returns 200 and lists posts newest first', async () => {
    await insertPost(mockDataLayerRow)
    await insertPost(helloHonoRow)
    const res = await SELF.fetch('http://example.com/')
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
    await insertPost(helloHonoRow)
    const res = await SELF.fetch('http://example.com/posts/hello-hono')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('Hono JSX で SSR を始める')
    expect(html).toContain('Cloudflare Workers 上で Hono の JSX を使い')
  })

  it('GET /posts/:slug returns 404 for a missing post', async () => {
    const res = await SELF.fetch('http://example.com/posts/does-not-exist')
    expect(res.status).toBe(404)
    const html = await res.text()
    expect(html).toContain('ページが見つかりません')
  })

  it('GET /posts/:slug includes og:image meta for an existing post', async () => {
    await insertPost(helloHonoRow)
    const res = await SELF.fetch('http://example.com/posts/hello-hono')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('property="og:image"')
    expect(html).toContain(
      'content="http://example.com/og/posts/hello-hono.png"',
    )
    expect(html).toContain('name="twitter:card" content="summary_large_image"')
  })
})

describe('og image routes', () => {
  it('GET /og/site.png returns 200 and image/png', async () => {
    const res = await SELF.fetch('http://example.com/og/site.png')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('image/png')
    expect(res.headers.get('cache-control')).toContain('max-age')
    const bytes = new Uint8Array(await res.arrayBuffer())
    expect(bytes[0]).toBe(0x89)
    expect(bytes[1]).toBe(0x50)
  })

  it('GET /og/posts/:slug.png returns 200 for an existing post', async () => {
    await insertPost(helloHonoRow)
    const res = await SELF.fetch('http://example.com/og/posts/hello-hono.png')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('image/png')
  })

  it('GET /og/posts/:slug.png returns 404 for a missing post', async () => {
    const res = await SELF.fetch('http://example.com/og/posts/does-not-exist.png')
    expect(res.status).toBe(404)
  })

  it('GET /og/posts/:slug.png returns 500 when D1 cannot read posts', async () => {
    await env.DB.prepare('DROP TABLE posts').run()
    const res = await SELF.fetch('http://example.com/og/posts/hello-hono.png')
    expect(res.status).toBe(500)
    await recreatePostsTable()
  })
})

describe('blog routes when storage fails', () => {
  afterEach(async () => {
    await recreatePostsTable()
  })

  it('GET / returns 500 when D1 cannot read posts', async () => {
    await env.DB.prepare('DROP TABLE posts').run()
    const res = await SELF.fetch('http://example.com/')
    expect(res.status).toBe(500)
    const html = await res.text()
    expect(html).toContain('サーバーエラー')
  })

  it('GET /posts/:slug returns 500 when D1 cannot read posts', async () => {
    await env.DB.prepare('DROP TABLE posts').run()
    const res = await SELF.fetch('http://example.com/posts/hello-hono')
    expect(res.status).toBe(500)
    const html = await res.text()
    expect(html).toContain('サーバーエラー')
  })
})

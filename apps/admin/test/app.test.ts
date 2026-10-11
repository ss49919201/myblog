import { SELF } from 'cloudflare:test'
import { describe, expect, it } from 'vitest'
import { getPost } from '../../web/src/posts/repository'
import { env } from 'cloudflare:test'
import { countPosts } from './db-helpers'
import { signAccessJwt } from './jwt-helpers'

function parseHiddenCsrf(html: string): string {
  const match = html.match(/name="csrf_token" value="([^"]+)"/)
  if (match === null) {
    throw new Error('csrf_token not found')
  }
  return match[1]
}

function parseSetCookie(header: string | null): string {
  if (header === null) {
    throw new Error('missing Set-Cookie')
  }
  const match = header.match(/admin_csrf=([^;]+)/)
  if (match === null) {
    throw new Error('admin_csrf cookie not found')
  }
  return decodeURIComponent(match[1])
}

async function openForm(jwt: string) {
  const res = await SELF.fetch('http://admin.example.com/', {
    headers: { 'Cf-Access-Jwt-Assertion': jwt },
  })
  const html = await res.text()
  const csrf = parseHiddenCsrf(html)
  const cookie = parseSetCookie(res.headers.get('Set-Cookie'))
  expect(csrf).toBe(cookie)
  return { csrf, cookie, html, status: res.status }
}

async function submitPost(
  jwt: string,
  cookie: string,
  csrf: string,
  title: string,
  body: string,
) {
  const form = new URLSearchParams()
  form.set('csrf_token', csrf)
  form.set('title', title)
  form.set('body', body)
  return SELF.fetch('http://admin.example.com/', {
    method: 'POST',
    headers: {
      'Cf-Access-Jwt-Assertion': jwt,
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: `admin_csrf=${encodeURIComponent(cookie)}`,
    },
    body: form.toString(),
  })
}

describe('admin ingest', () => {
  it('GET / returns 403 without JWT', async () => {
    const res = await SELF.fetch('http://admin.example.com/')
    expect(res.status).toBe(403)
  })

  it('GET / returns 403 with invalid JWT', async () => {
    const res = await SELF.fetch('http://admin.example.com/', {
      headers: { 'Cf-Access-Jwt-Assertion': 'not-a-jwt' },
    })
    expect(res.status).toBe(403)
  })

  it('GET / returns 403 with expired JWT', async () => {
    const jwt = await signAccessJwt({ expired: true })
    const res = await SELF.fetch('http://admin.example.com/', {
      headers: { 'Cf-Access-Jwt-Assertion': jwt },
    })
    expect(res.status).toBe(403)
  })

  it('GET / shows form with valid JWT', async () => {
    const jwt = await signAccessJwt()
    const { status, html } = await openForm(jwt)
    expect(status).toBe(200)
    expect(html).toContain('記事を入稿')
  })

  it('POST rejects missing CSRF', async () => {
    const jwt = await signAccessJwt()
    const form = await openForm(jwt)
    const res = await submitPost(jwt, form.cookie, 'wrong-token', 't', 'b')
    expect(res.status).toBe(403)
    const html = await res.text()
    expect(html).toContain('CSRF')
  })

  it('POST rejects empty title', async () => {
    const jwt = await signAccessJwt()
    const form = await openForm(jwt)
    const res = await submitPost(jwt, form.cookie, form.csrf, '  ', '本文')
    expect(res.status).toBe(400)
    const html = await res.text()
    expect(html).toContain('タイトルを入力してください')
    expect(html).toContain('本文')
  })

  it('POST rejects empty body', async () => {
    const jwt = await signAccessJwt()
    const form = await openForm(jwt)
    const res = await submitPost(jwt, form.cookie, form.csrf, 'タイトル', ' ')
    expect(res.status).toBe(400)
    const html = await res.text()
    expect(html).toContain('本文を入力してください')
    expect(html).toContain('タイトル')
  })

  it('POST inserts a post readable by web getPost', async () => {
    const jwt = await signAccessJwt()
    const form = await openForm(jwt)
    const title = 'テスト入稿'
    const body = '# 見出し\n\n本文 **太字**'
    const res = await submitPost(jwt, form.cookie, form.csrf, title, body)
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('公開しました')
    expect(html).toContain('http://example.com/posts/')
    expect(await countPosts()).toBe(1)

    const slugMatch = html.match(/http:\/\/example\.com\/posts\/([^"<]+)/)
    expect(slugMatch).not.toBeNull()
    const slug = decodeURIComponent(slugMatch![1])
    const postResult = await getPost(env.DB, slug)
    expect(postResult.isOk()).toBe(true)
    if (!postResult.isOk()) return
    expect(postResult.value.title).toBe(title)
    expect(postResult.value.bodyHtml).toContain('<strong>太字</strong>')
  })

  it('JWT audience mismatch returns 403', async () => {
    const jwt = await signAccessJwt({ audience: 'wrong-audience' })
    const res = await SELF.fetch('http://admin.example.com/', {
      headers: { 'Cf-Access-Jwt-Assertion': jwt },
    })
    expect(res.status).toBe(403)
  })
})

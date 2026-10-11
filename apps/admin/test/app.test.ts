import { env, SELF } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import { getPost } from '../../web/src/posts/repository'
import { signAccessJwt } from './access-jwt'
import { resetPosts } from './apply-schema'

describe('admin compose', () => {
  beforeEach(async () => {
    await resetPosts()
  })

  async function getFormCsrf(): Promise<{ csrf: string; cookie: string }> {
    const jwt = await signAccessJwt()
    const res = await SELF.fetch('http://example.com/', {
      headers: { 'Cf-Access-Jwt-Assertion': jwt },
    })
    expect(res.status).toBe(200)
    const setCookie = res.headers.get('Set-Cookie') ?? ''
    const match = setCookie.match(/myblog_admin_csrf=([a-f0-9]+)/)
    expect(match).not.toBeNull()
    return {
      csrf: match![1],
      cookie: `myblog_admin_csrf=${match![1]}`,
    }
  }

  it('rejects GET without JWT', async () => {
    const res = await SELF.fetch('http://example.com/')
    expect(res.status).toBe(403)
  })

  it('rejects GET with invalid JWT', async () => {
    const res = await SELF.fetch('http://example.com/', {
      headers: { 'Cf-Access-Jwt-Assertion': 'not-a-jwt' },
    })
    expect(res.status).toBe(403)
  })

  it('rejects POST without CSRF', async () => {
    const jwt = await signAccessJwt()
    const res = await SELF.fetch('http://example.com/', {
      method: 'POST',
      headers: {
        'Cf-Access-Jwt-Assertion': jwt,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        csrf_token: 'bad',
        title: 'Hello',
        body_md: '**bold**',
      }),
    })
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('CSRF')
  })

  it('rejects empty title or body', async () => {
    const jwt = await signAccessJwt()
    const { csrf, cookie } = await getFormCsrf()
    const res = await SELF.fetch('http://example.com/', {
      method: 'POST',
      headers: {
        'Cf-Access-Jwt-Assertion': jwt,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookie,
      },
      body: new URLSearchParams({
        csrf_token: csrf,
        title: '  ',
        body_md: 'x',
      }),
    })
    const html = await res.text()
    expect(html).toContain('必須')
  })

  it('inserts a post readable by web getPost', async () => {
    const jwt = await signAccessJwt()
    const { csrf, cookie } = await getFormCsrf()
    const res = await SELF.fetch('http://example.com/', {
      method: 'POST',
      headers: {
        'Cf-Access-Jwt-Assertion': jwt,
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: cookie,
      },
      body: new URLSearchParams({
        csrf_token: csrf,
        title: 'テスト記事',
        body_md: '# Hi\n\n**bold**',
      }),
    })
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('https://blog.example.com/posts/')
    expect(html).toContain('公開しました')

    const slugMatch = html.match(/posts\/([^"<]+)/)
    expect(slugMatch).not.toBeNull()
    const slug = slugMatch![1]

    const postResult = await getPost(env.DB, slug)
    expect(postResult.isOk()).toBe(true)
    const post = postResult._unsafeUnwrap()
    expect(post.title).toBe('テスト記事')
    expect(post.bodyHtml).toContain('<strong>bold</strong>')

    const row = await env.DB.prepare(
      'SELECT body_md FROM posts WHERE slug = ?',
    )
      .bind(slug)
      .first<{ body_md: string }>()
    expect(row?.body_md).toContain('**bold**')
  })
})

import { env, SELF } from 'cloudflare:test'
import { beforeEach, describe, expect, it } from 'vitest'
import { getPost } from '../../web/src/posts/repository'
import { resetPosts } from './apply-schema'

function formPostInit(body: URLSearchParams): RequestInit {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Origin: 'http://example.com',
      'Sec-Fetch-Site': 'same-origin',
    },
    body,
  }
}

describe('admin compose', () => {
  beforeEach(async () => {
    await resetPosts()
  })

  it('GET / returns the compose form', async () => {
    const res = await SELF.fetch('http://example.com/')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('本文（Markdown）')
  })

  it('rejects POST without CSRF headers', async () => {
    const res = await SELF.fetch('http://example.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ title: 'Hello', body_md: 'x' }),
    })
    expect(res.status).toBe(403)
  })

  it('rejects empty title or body', async () => {
    const res = await SELF.fetch(
      'http://example.com/',
      formPostInit(
        new URLSearchParams({
          title: '  ',
          body_md: 'x',
        }),
      ),
    )
    const html = await res.text()
    expect(html).toContain('必須')
  })

  it('inserts a post readable by web getPost', async () => {
    const res = await SELF.fetch(
      'http://example.com/',
      formPostInit(
        new URLSearchParams({
          title: 'テスト記事',
          body_md: '# Hi\n\n**bold**',
        }),
      ),
    )
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

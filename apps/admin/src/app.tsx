import { type Context, Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { jsxRenderer } from 'hono/jsx-renderer'
import { verifyAccessRequest } from './auth/access-jwt'
import {
  csrfCookieName,
  csrfMatches,
  newCsrfToken,
  readCsrfCookie,
} from './csrf'
import { createPost, validateCreateInput } from './domain/create-post'
import type { Env } from './env'
import { FormPage } from './views/FormPage'

const app = new Hono<{ Bindings: Env }>()

app.use('*', jsxRenderer())

app.use('*', async (c, next) => {
  const auth = await verifyAccessRequest(c.req.raw, c.env)
  if (auth.isErr()) {
    return c.text('Forbidden', 403)
  }
  await next()
})

function postUrl(env: Env, slug: string): string {
  const origin = env.PUBLIC_WEB_ORIGIN.replace(/\/$/, '')
  return `${origin}/posts/${encodeURIComponent(slug)}`
}

function ensureCsrfCookie(c: Context<{ Bindings: Env }>): string {
  const existing = getCookie(c, csrfCookieName())
  if (existing !== undefined && existing.length > 0) {
    return existing
  }
  const token = newCsrfToken()
  const secure = new URL(c.req.url).protocol === 'https:'
  setCookie(c, csrfCookieName(), token, {
    httpOnly: true,
    secure,
    sameSite: 'Strict',
    path: '/',
  })
  return token
}

app.get('/', (c) => {
  const csrfToken = ensureCsrfCookie(c)
  return c.render(
    <FormPage csrfToken={csrfToken} title="" body="" />,
  )
})

app.post('/', async (c) => {
  const csrfToken = ensureCsrfCookie(c)
  const form = await c.req.parseBody()
  const title = typeof form.title === 'string' ? form.title : ''
  const body = typeof form.body === 'string' ? form.body : ''
  const formCsrf =
    typeof form.csrf_token === 'string' ? form.csrf_token : null
  const cookieCsrf = readCsrfCookie(c.req.header('Cookie') ?? null)

  if (!csrfMatches(cookieCsrf, formCsrf)) {
    c.status(403)
    return c.render(
      <FormPage
        csrfToken={csrfToken}
        title={title}
        body={body}
        errorMessage="CSRF トークンが無効です。ページを再読み込みしてやり直してください。"
      />,
    )
  }

  const validated = validateCreateInput(title, body)
  if (!validated.ok) {
    const err = validated.error
    const message =
      err.type === 'ValidationError'
        ? err.message
        : '入力内容を確認してください'
    c.status(400)
    return c.render(
      <FormPage
        csrfToken={csrfToken}
        title={title}
        body={body}
        errorMessage={message}
      />,
    )
  }

  const created = await createPost(c.env.DB, validated.value)
  return created.match(
    (post) =>
      c.render(
        <FormPage
          csrfToken={csrfToken}
          title=""
          body=""
          successUrl={postUrl(c.env, post.slug)}
        />,
      ),
    (error) => {
      const message =
        error.type === 'MarkdownError'
          ? 'Markdown の変換に失敗しました'
          : '保存に失敗しました。時間をおいて再度お試しください。'
      c.status(500)
      return c.render(
        <FormPage
          csrfToken={csrfToken}
          title={title}
          body={body}
          errorMessage={message}
        />,
      )
    },
  )
})

export default app

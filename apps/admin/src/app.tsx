import { Hono } from 'hono'
import type { Context } from 'hono'
import { jsxRenderer } from 'hono/jsx-renderer'
import { verifyAccessJwt } from './auth/access'
import {
  csrfClearCookieHeader,
  csrfSetCookieHeader,
  generateCsrfToken,
  verifyCsrf,
} from './csrf'
import type { Env } from './env'
import { insertPost } from './posts/repository'
import { ComposePage } from './views/ComposePage'

const app = new Hono<{ Bindings: Env }>()

app.use('*', jsxRenderer())

async function requireAccess(
  c: { req: { header: (name: string) => string | undefined }; env: Env },
): Promise<boolean> {
  const assertion = c.req.header('Cf-Access-Jwt-Assertion')
  return verifyAccessJwt(c.env, assertion)
}

function publicPostUrl(env: Env, slug: string): string {
  const base = env.PUBLIC_WEB_URL.replace(/\/$/, '')
  return `${base}/posts/${slug}`
}

function renderForm(
  c: Context<{ Bindings: Env }>,
  props: {
    csrfToken: string
    title?: string
    bodyMd?: string
    errorMessage?: string
    publishedUrl?: string
    setCsrf?: boolean
  },
) {
  if (props.setCsrf) {
    c.header('Set-Cookie', csrfSetCookieHeader(props.csrfToken))
  }
  const page = (
    <ComposePage
      csrfToken={props.csrfToken}
      title={props.title}
      bodyMd={props.bodyMd}
      errorMessage={props.errorMessage}
      publishedUrl={props.publishedUrl}
    />
  )
  return c.render(page)
}

app.get('/', async (c) => {
  if (!(await requireAccess(c))) {
    return c.text('Forbidden', 403)
  }
  const token = generateCsrfToken()
  return renderForm(c, { csrfToken: token, setCsrf: true })
})

app.post('/', async (c) => {
  if (!(await requireAccess(c))) {
    return c.text('Forbidden', 403)
  }

  const contentType = c.req.header('Content-Type') ?? ''
  if (!contentType.includes('application/x-www-form-urlencoded')) {
    return c.text('Forbidden', 403)
  }

  const form = await c.req.parseBody()
  const title = typeof form.title === 'string' ? form.title : ''
  const bodyMd = typeof form.body_md === 'string' ? form.body_md : ''
  const formCsrf = typeof form.csrf_token === 'string' ? form.csrf_token : ''
  const cookieHeader = c.req.header('Cookie')

  const csrfOk = verifyCsrf(cookieHeader, formCsrf)
  const csrfToken = csrfOk ? formCsrf : generateCsrfToken()

  if (!csrfOk) {
    c.header('Set-Cookie', csrfSetCookieHeader(csrfToken))
    return renderForm(c, {
      csrfToken,
      title,
      bodyMd,
      errorMessage: 'CSRF トークンが無効です。もう一度送信してください。',
      setCsrf: false,
    })
  }

  const publishedAt = new Date()
  const result = await insertPost(c.env.DB, {
    title,
    bodyMd,
    publishedAt,
  })

  return result.match(
    (post) => {
      const freshToken = generateCsrfToken()
      c.header('Set-Cookie', csrfSetCookieHeader(freshToken))
      return renderForm(c, {
        csrfToken: freshToken,
        publishedUrl: publicPostUrl(c.env, post.slug),
        setCsrf: false,
      })
    },
    (error) => {
      c.header('Set-Cookie', csrfSetCookieHeader(csrfToken))
      const message =
        error.type === 'ValidationError'
          ? error.message
          : '保存に失敗しました。しばらくしてから再度お試しください。'
      return renderForm(c, {
        csrfToken,
        title,
        bodyMd,
        errorMessage: message,
        setCsrf: false,
      })
    },
  )
})

export default app

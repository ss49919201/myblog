import { Hono } from 'hono'
import type { Context } from 'hono'
import { csrf } from 'hono/csrf'
import { jsxRenderer } from 'hono/jsx-renderer'
import { submitPost } from '../../application/submit-post'
import type { Env } from '../../env'
import { ComposePage } from '../../views/ComposePage'
import { markdownItRenderer } from '../markdown/markdown-it-renderer'
import { createD1PostRepository } from '../persistence/d1-post-repository'

const app = new Hono<{ Bindings: Env }>()

app.use('*', jsxRenderer())

function publicPostUrl(env: Env, slug: string): string {
  const base = env.PUBLIC_WEB_URL.replace(/\/$/, '')
  return `${base}/posts/${slug}`
}

function renderForm(
  c: Context<{ Bindings: Env }>,
  props: {
    title?: string
    bodyMd?: string
    errorMessage?: string
    publishedUrl?: string
  },
) {
  const page = (
    <ComposePage
      title={props.title}
      bodyMd={props.bodyMd}
      errorMessage={props.errorMessage}
      publishedUrl={props.publishedUrl}
    />
  )
  return c.render(page)
}

app.get('/', (c) => renderForm(c, {}))

app.post('/', csrf(), async (c) => {
  const form = await c.req.parseBody()
  const title = typeof form.title === 'string' ? form.title : ''
  const bodyMd = typeof form.body_md === 'string' ? form.body_md : ''

  const publishedAt = new Date()
  const result = await submitPost(
    {
      posts: createD1PostRepository(c.env.DB),
      markdown: markdownItRenderer,
    },
    {
      title,
      bodyMd,
      publishedAt,
    },
  )

  return result.match(
    (post) =>
      renderForm(c, {
        publishedUrl: publicPostUrl(c.env, post.slug),
      }),
    (error) => {
      const message =
        error.type === 'ValidationError'
          ? error.message
          : '保存に失敗しました。しばらくしてから再度お試しください。'
      return renderForm(c, {
        title,
        bodyMd,
        errorMessage: message,
      })
    },
  )
})

export default app

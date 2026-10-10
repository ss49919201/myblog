import type { Context } from 'hono'
import type { Env } from '../env'
import { absoluteUrl, siteOgImageUrl } from '../meta'
import type { PostsError } from './errors'
import { SITE_NAME } from '../theme'
import { NotFoundPage } from '../views/NotFoundPage'
import { ServerErrorPage } from '../views/ServerErrorPage'

function errorPageMeta(c: Context<{ Bindings: Env }>, title: string, description: string) {
  return {
    title,
    description,
    type: 'website' as const,
    url: absoluteUrl(c, new URL(c.req.url).pathname),
    image: siteOgImageUrl(c),
    imageAlt: SITE_NAME,
  }
}

export function renderPostsError(c: Context<{ Bindings: Env }>, error: PostsError) {
  if (error.type === 'NotFound') {
    c.status(404)
    return c.render(
      <NotFoundPage
        meta={errorPageMeta(
          c,
          `404 | ${SITE_NAME}`,
          '指定されたページは見つかりませんでした。',
        )}
      />,
    )
  }
  c.status(500)
  return c.render(
    <ServerErrorPage
      meta={errorPageMeta(
        c,
        `500 | ${SITE_NAME}`,
        '記事の取得に失敗しました。',
      )}
    />,
  )
}

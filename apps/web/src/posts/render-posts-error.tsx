import type { Context } from 'hono'
import type { Env } from '../env'
import { absoluteUrl, siteOgImageUrl } from '../meta'
import type { PostsError } from './errors'
import { DEFAULT_SITE_TITLE } from '../site-settings/default'
import { NotFoundPage } from '../views/NotFoundPage'
import { ServerErrorPage } from '../views/ServerErrorPage'

function errorPageMeta(
  c: Context<{ Bindings: Env }>,
  title: string,
  description: string,
  siteTitle: string,
) {
  return {
    title,
    description,
    type: 'website' as const,
    url: absoluteUrl(c, new URL(c.req.url).pathname),
    image: siteOgImageUrl(c),
    imageAlt: siteTitle,
  }
}

export function renderPostsError(
  c: Context<{ Bindings: Env }>,
  error: PostsError,
  siteTitle: string = DEFAULT_SITE_TITLE,
) {
  if (error.type === 'NotFound') {
    c.status(404)
    return c.render(
      <NotFoundPage
        siteTitle={siteTitle}
        meta={errorPageMeta(
          c,
          `404 | ${siteTitle}`,
          '指定されたページは見つかりませんでした。',
          siteTitle,
        )}
      />,
    )
  }
  c.status(500)
  return c.render(
    <ServerErrorPage
      siteTitle={siteTitle}
      meta={errorPageMeta(
        c,
        `500 | ${siteTitle}`,
        '記事の取得に失敗しました。',
        siteTitle,
      )}
    />,
  )
}

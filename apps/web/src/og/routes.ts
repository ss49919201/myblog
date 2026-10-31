import { Hono } from 'hono'
import type { Env } from '../env'
import { getPost } from '../posts/repository'
import { resolveSiteTitle } from '../site-settings/resolve-site-title'
import { ogCacheUrl } from './cache-url'
import { withOgCache } from './cache'
import { renderPostOgPng, renderSiteOgPng } from './render'

function ogAssetBaseUrl(c: { req: { url: string } }): string {
  return new URL(c.req.url).origin
}

export function registerOgRoutes(app: Hono<{ Bindings: Env }>): void {
  app.get('/og/site.png', async (c) => {
    const cacheUrl = ogCacheUrl(c, '/og/site.png')
    const assetBaseUrl = ogAssetBaseUrl(c)
    const siteTitle = await resolveSiteTitle(c.env.DB)
    return withOgCache(c, cacheUrl, () =>
      renderSiteOgPng(siteTitle, assetBaseUrl),
    )
  })

  app.get('/og/posts/:slug', async (c) => {
    const raw = c.req.param('slug') ?? ''
    if (!raw.endsWith('.png')) {
      return c.body(null, 404)
    }
    const slug = raw.slice(0, -'.png'.length)
    const result = await getPost(c.env.DB, slug)
    const siteTitle = await resolveSiteTitle(c.env.DB)
    return result.match(
      async (post) => {
        const cacheUrl = ogCacheUrl(c, `/og/posts/${post.slug}.png`)
        const assetBaseUrl = ogAssetBaseUrl(c)
        return withOgCache(c, cacheUrl, () =>
          renderPostOgPng(post.title, siteTitle, assetBaseUrl),
        )
      },
      (error) => {
        if (error.type === 'NotFound') {
          return c.body(null, 404)
        }
        return c.body(null, 500)
      },
    )
  })
}

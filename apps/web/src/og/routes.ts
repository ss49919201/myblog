import { Hono } from 'hono'
import type { Env } from '../env'
import { getPost } from '../posts/repository'
import { absoluteUrl } from '../meta'
import { withOgCache } from './cache'
import { renderPostOgPng, renderSiteOgPng } from './render'

export function registerOgRoutes(app: Hono<{ Bindings: Env }>): void {
  app.get('/og/site.png', async (c) => {
    const cacheUrl = absoluteUrl(c, '/og/site.png')
    return withOgCache(c, cacheUrl, () => renderSiteOgPng())
  })

  app.get('/og/posts/:slug', async (c) => {
    const raw = c.req.param('slug') ?? ''
    if (!raw.endsWith('.png')) {
      return c.body(null, 404)
    }
    const slug = raw.slice(0, -'.png'.length)
    const result = await getPost(c.env.DB, slug)
    return result.match(
      async (post) => {
        const cacheUrl = absoluteUrl(c, `/og/posts/${post.slug}.png`)
        return withOgCache(c, cacheUrl, () => renderPostOgPng(post.title))
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

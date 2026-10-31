import { Hono } from 'hono'
import { jsxRenderer } from 'hono/jsx-renderer'
import type { Env } from './env'
import {
  absoluteUrl,
  excerptFromBody,
  postOgImageUrl,
  siteOgImageUrl,
} from './meta'
import { registerOgRoutes } from './og/routes'
import { renderPostsError } from './posts/render-posts-error'
import { getPost, listPosts } from './posts/repository'
import { resolveSiteTitle } from './site-settings/resolve-site-title'
import { HomePage } from './views/HomePage'
import { PostPage } from './views/PostPage'

const app = new Hono<{ Bindings: Env }>()

app.use('*', jsxRenderer())

registerOgRoutes(app)

app.get('/', async (c) => {
  const siteTitle = await resolveSiteTitle(c.env.DB)
  const result = await listPosts(c.env.DB)
  return result.match(
    (posts) => {
      const meta = {
        title: siteTitle,
        description: `${siteTitle} の記事一覧です。`,
        type: 'website' as const,
        url: absoluteUrl(c, '/'),
        image: siteOgImageUrl(c),
        imageAlt: siteTitle,
      }
      return c.render(<HomePage posts={posts} meta={meta} siteTitle={siteTitle} />)
    },
    (error) => renderPostsError(c, error, siteTitle),
  )
})

app.get('/posts/:slug', async (c) => {
  const slug = c.req.param('slug')
  const siteTitle = await resolveSiteTitle(c.env.DB)
  const result = await getPost(c.env.DB, slug)
  return result.match(
    (post) => {
      const meta = {
        title: `${post.title} | ${siteTitle}`,
        description: excerptFromBody(post.bodyHtml),
        type: 'article' as const,
        url: absoluteUrl(c, `/posts/${post.slug}`),
        image: postOgImageUrl(c, post.slug),
        imageAlt: post.title,
      }
      return c.render(<PostPage post={post} meta={meta} siteTitle={siteTitle} />)
    },
    (error) => renderPostsError(c, error, siteTitle),
  )
})

export default app

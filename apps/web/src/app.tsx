import { Hono } from 'hono'
import { jsxRenderer } from 'hono/jsx-renderer'
import type { Env } from './env'
import { renderPostsError } from './posts/render-posts-error'
import { getPost, listPosts } from './posts/repository'
import { HomePage } from './views/HomePage'
import { PostPage } from './views/PostPage'

const app = new Hono<{ Bindings: Env }>()

app.use('*', jsxRenderer())

app.get('/', async (c) => {
  const result = await listPosts(c.env.DB)
  return result.match(
    (posts) => c.render(<HomePage posts={posts} />),
    (error) => renderPostsError(c, error),
  )
})

app.get('/posts/:slug', async (c) => {
  const slug = c.req.param('slug')
  const result = await getPost(c.env.DB, slug)
  return result.match(
    (post) => c.render(<PostPage post={post} />),
    (error) => renderPostsError(c, error),
  )
})

export default app

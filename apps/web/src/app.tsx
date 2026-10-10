import { Hono } from 'hono'
import { jsxRenderer } from 'hono/jsx-renderer'
import { getPost, listPosts } from './posts/repository'
import { HomePage } from './views/HomePage'
import { NotFoundPage } from './views/NotFoundPage'
import { PostPage } from './views/PostPage'

const app = new Hono()

app.use('*', jsxRenderer())

app.get('/', (c) => {
  const posts = listPosts()
  return c.render(<HomePage posts={posts} />)
})

app.get('/posts/:slug', (c) => {
  const slug = c.req.param('slug')
  const post = getPost(slug)
  if (!post) {
    c.status(404)
    return c.render(<NotFoundPage />)
  }
  return c.render(<PostPage post={post} />)
})

export default app

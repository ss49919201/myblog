import { Hono } from 'hono'
import { jsxRenderer } from 'hono/jsx-renderer'
import { renderPostsError } from './posts/render-posts-error'
import { getPost, listPosts } from './posts/repository'
import { HomePage } from './views/HomePage'
import { PostPage } from './views/PostPage'

const app = new Hono()

app.use('*', jsxRenderer())

app.get('/', (c) => {
  const result = listPosts()
  return result.match(
    (posts) => c.render(<HomePage posts={posts} />),
    (error) => renderPostsError(c, error),
  )
})

app.get('/posts/:slug', (c) => {
  const slug = c.req.param('slug')
  const result = getPost(slug)
  return result.match(
    (post) => c.render(<PostPage post={post} />),
    (error) => renderPostsError(c, error),
  )
})

export default app

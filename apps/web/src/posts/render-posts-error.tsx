import type { Context } from 'hono'
import type { PostsError } from './errors'
import { NotFoundPage } from '../views/NotFoundPage'
import { ServerErrorPage } from '../views/ServerErrorPage'

export function renderPostsError(c: Context, error: PostsError) {
  if (error.type === 'NotFound') {
    c.status(404)
    return c.render(<NotFoundPage />)
  }
  c.status(500)
  return c.render(<ServerErrorPage />)
}

import { submitPost } from './application/submit-post'
import { createAdminHttpApp } from './adapter/http/app'
import { markdownItRenderer } from './adapter/markdown/markdown-it-renderer'
import { createD1PostRepository } from './adapter/persistence/d1-post-repository'
import type { Env } from './env'

const app = createAdminHttpApp((env: Env) => {
  const deps = {
    posts: createD1PostRepository(env.DB),
    markdown: markdownItRenderer,
  }
  return (input) => submitPost(deps, input)
})

export default app

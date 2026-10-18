import { createApp } from './app'
import { toAppEnv } from './env'

const app = createApp()

export default {
  fetch(
    request: Request,
    workerEnv: Cloudflare.Env,
    ctx: ExecutionContext,
  ): Response | Promise<Response> {
    return app.fetch(request, toAppEnv(workerEnv), ctx)
  },
}

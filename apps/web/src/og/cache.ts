import type { Context } from 'hono'
import type { Env } from '../env'

export const OG_CACHE_CONTROL =
  'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400'

export async function withOgCache(
  c: Context<{ Bindings: Env }>,
  cacheUrl: string,
  render: () => Promise<Response>,
): Promise<Response> {
  const cache = caches.default
  const key = new Request(cacheUrl, { method: 'GET' })
  const cached = await cache.match(key)
  if (cached) {
    return cached
  }

  const response = await render()
  response.headers.set('Cache-Control', OG_CACHE_CONTROL)

  c.executionCtx.waitUntil(cache.put(key, response.clone()))
  return response
}

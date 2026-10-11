import type { Context } from 'hono'
import type { Env } from '../env'
import { absoluteUrl } from '../meta'
import { ogImage } from '../theme'

export function ogCacheUrl(c: Context<{ Bindings: Env }>, path: string): string {
  const url = new URL(absoluteUrl(c, path))
  url.searchParams.set('v', String(ogImage.designVersion))
  return url.toString()
}

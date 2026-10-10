import type { Context } from 'hono'
import type { Env } from './env'

export type PageMeta = {
  title: string
  description: string
  type: 'website' | 'article'
  url: string
  image: string
  imageAlt: string
}

export function requestOrigin(c: Context<{ Bindings: Env }>): string {
  const configured = c.env.SITE_ORIGIN
  if (configured) {
    return configured.replace(/\/$/, '')
  }
  return new URL(c.req.url).origin
}

export function absoluteUrl(
  c: Context<{ Bindings: Env }>,
  pathname: string,
): string {
  return new URL(pathname, `${requestOrigin(c)}/`).href
}

export function excerptFromBody(body: string, maxLen = 160): string {
  const first = body.split(/\n\n+/)[0]?.trim() ?? ''
  if (first.length <= maxLen) {
    return first
  }
  return `${first.slice(0, maxLen - 1)}…`
}

export function siteOgImageUrl(c: Context<{ Bindings: Env }>): string {
  return absoluteUrl(c, '/og/site.png')
}

export function postOgImageUrl(
  c: Context<{ Bindings: Env }>,
  slug: string,
): string {
  return absoluteUrl(c, `/og/posts/${slug}.png`)
}

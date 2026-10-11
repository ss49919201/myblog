import { env } from 'cloudflare:test'

export async function countPosts(): Promise<number> {
  const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM posts')
    .first<{ n: number }>()
  return row?.n ?? 0
}

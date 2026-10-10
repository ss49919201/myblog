import { env } from 'cloudflare:test'
import { inject } from 'vitest'

export type TestPostRow = {
  slug: string
  title: string
  published_at: string
  body: string
}

export const helloHonoRow: TestPostRow = {
  slug: 'hello-hono',
  title: 'Hono JSX で SSR を始める',
  published_at: '2026-10-08T00:00:00.000Z',
  body:
    'Cloudflare Workers 上で Hono の JSX を使い、サーバー側だけで HTML を返すブログの土台を用意しました。',
}

export const mockDataLayerRow: TestPostRow = {
  slug: 'mock-data-layer',
  title: 'リポジトリ関数の裏にモックを置く',
  published_at: '2026-10-05T03:30:00.000Z',
  body: 'listPosts と getPost の二つの入口だけ公開し、呼び出し側は永続化の詳細を知りません。',
}

export async function insertPost(row: TestPostRow): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO posts (slug, title, published_at, body) VALUES (?, ?, ?, ?)',
  )
    .bind(row.slug, row.title, row.published_at, row.body)
    .run()
}

export async function recreatePostsTable(): Promise<void> {
  await env.DB.prepare('DROP TABLE IF EXISTS posts').run()
  for (const migration of inject('testMigrations')) {
    for (const query of migration.queries) {
      await env.DB.prepare(query).run()
    }
  }
}

import type { PostRow } from './post-rows'

export const seedPostRows: PostRow[] = [
  {
    slug: 'hello-hono',
    title: 'Hono JSX で SSR を始める',
    published_at: '2026-10-08T00:00:00.000Z',
    body:
      'Cloudflare Workers 上で Hono の JSX を使い、サーバー側だけで HTML を返すブログの土台を用意しました。',
  },
  {
    slug: 'mock-data-layer',
    title: 'リポジトリ関数の裏にモックを置く',
    published_at: '2026-10-05T03:30:00.000Z',
    body: 'listPosts と getPost の二つの入口だけ公開し、呼び出し側は永続化の詳細を知りません。',
  },
  {
    slug: 'accent-color',
    title: '薄紫のアクセント',
    published_at: '2026-10-01T09:00:00.000Z',
    body: '本文は読みやすさ優先のシンプルなタイポグラフィです。',
  },
  {
    slug: 'workers-dev',
    title: 'ローカルでは wrangler dev',
    published_at: '2026-09-28T01:15:00.000Z',
    body:
      'pnpm install のあと、apps/web で wrangler dev を実行すると Workers と同じルーティングを手元で確認できます。',
  },
]

export function createMockD1(
  rows: PostRow[],
  options?: { fail?: boolean },
): D1Database {
  const fail = options?.fail ?? false
  return {
    prepare(sql: string) {
      const statement = {
        bind(...args: unknown[]) {
          return {
            async all<T>() {
              if (fail) {
                throw new Error('mock d1 failure')
              }
              if (sql.includes('ORDER BY published_at DESC')) {
                const sorted = [...rows].sort((a, b) =>
                  b.published_at.localeCompare(a.published_at),
                )
                return { results: sorted as T[], success: true, meta: {} }
              }
              return { results: rows as T[], success: true, meta: {} }
            },
            async first<T>() {
              if (fail) {
                throw new Error('mock d1 failure')
              }
              const slug = args[0] as string
              const row = rows.find((item) => item.slug === slug)
              return (row ?? null) as T | null
            },
          }
        },
        async all<T>() {
          if (fail) {
            throw new Error('mock d1 failure')
          }
          if (sql.includes('ORDER BY published_at DESC')) {
            const sorted = [...rows].sort((a, b) =>
              b.published_at.localeCompare(a.published_at),
            )
            return { results: sorted as T[], success: true, meta: {} }
          }
          return { results: rows as T[], success: true, meta: {} }
        },
      }
      return statement as D1PreparedStatement
    },
    batch: async () => [],
    dump: async () => new ArrayBuffer(0),
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database
}

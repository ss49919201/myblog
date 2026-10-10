import type { Post } from './types'

export const mockPosts: Post[] = [
  {
    slug: 'hello-hono',
    title: 'Hono JSX で SSR を始める',
    publishedAt: new Date('2026-10-08T09:00:00+09:00'),
    body: `Cloudflare Workers 上で Hono の JSX を使い、サーバー側だけで HTML を返すブログの土台を用意しました。

React やクライアントバンドルは使わず、ルートごとにコンポーネントを描画します。記事データはいまは TypeScript の配列ですが、あとから D1 などに差し替えやすい形にしています。`,
  },
  {
    slug: 'mock-data-layer',
    title: 'リポジトリ関数の裏にモックを置く',
    publishedAt: new Date('2026-10-05T12:30:00+09:00'),
    body: `listPosts と getPost の二つの入口だけ公開し、呼び出し側は永続化の詳細を知りません。

一覧は公開日の新しい順。存在しない slug は 404 ページを返します。`,
  },
  {
    slug: 'accent-color',
    title: '薄紫のアクセント',
    publishedAt: new Date('2026-10-01T18:00:00+09:00'),
    body: `本文は読みやすさ優先のシンプルなタイポグラフィです。

区切り線やリンクの下線には #c4b5fd を少しだけ使い、全体のトーンは控えめに保ちます。`,
  },
  {
    slug: 'workers-dev',
    title: 'ローカルでは wrangler dev',
    publishedAt: new Date('2026-09-28T10:15:00+09:00'),
    body: `pnpm install のあと、apps/web で wrangler dev を実行すると Workers と同じルーティングを手元で確認できます。

テストは Hono の app.request で HTTP レイヤをそのままたたきます。`,
  },
]

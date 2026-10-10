INSERT INTO posts (slug, title, published_at, body_html) VALUES
(
  'hello-hono',
  'Hono JSX で SSR を始める',
  '2026-10-08T00:00:00.000Z',
  '<p>Cloudflare Workers 上で Hono の JSX を使い、サーバー側だけで HTML を返すブログの土台を用意しました。</p><p>React やクライアントバンドルは使わず、ルートごとにコンポーネントを描画します。記事データはいまは TypeScript の配列ですが、あとから D1 などに差し替えやすい形にしています。</p>'
),
(
  'mock-data-layer',
  'リポジトリ関数の裏にモックを置く',
  '2026-10-05T03:30:00.000Z',
  '<p>listPosts と getPost の二つの入口だけ公開し、呼び出し側は永続化の詳細を知りません。</p><p>一覧は公開日の新しい順。存在しない slug は 404 ページを返します。</p>'
),
(
  'accent-color',
  '薄紫のアクセント',
  '2026-10-01T09:00:00.000Z',
  '<p>本文は読みやすさ優先のシンプルなタイポグラフィです。</p><p>区切り線やリンクの下線には #c4b5fd を少しだけ使い、全体のトーンは控えめに保ちます。</p>'
),
(
  'workers-dev',
  'ローカルでは wrangler dev',
  '2026-09-28T01:15:00.000Z',
  '<p>pnpm install のあと、apps/web で wrangler dev を実行すると Workers と同じルーティングを手元で確認できます。</p><p>テストは Hono の app.request で HTTP レイヤをそのままたたきます。</p>'
);

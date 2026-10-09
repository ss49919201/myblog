# @myblog/web

Cloudflare Workers 上で動く Hono + JSX の SSR ブログ（モックデータ）。

## 必要条件

- Node.js 22.12 以上（リポジトリルートの `.nvmrc`）
- pnpm 10 以上

## セットアップと起動

リポジトリルートで依存を入れます。

```sh
corepack enable
pnpm install
```

アプリの開発サーバー（Wrangler）:

```sh
pnpm --filter @myblog/web dev
```

ブラウザで `http://localhost:8787/` を開きます。

## チェック

```sh
pnpm --filter @myblog/web typecheck
pnpm --filter @myblog/web test
```

## ルート

| パス | 内容 |
| --- | --- |
| `/` | 記事一覧（新しい順） |
| `/posts/:slug` | 記事詳細。存在しない slug は 404 |

記事の取得は `src/posts/repository.ts` の `listPosts` / `getPost` 経由です。

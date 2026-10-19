# @myblog/web

Cloudflare Workers 上で動く Hono + JSX の SSR ブログ。記事は D1 に保存します。スキーマの正本は [Drizzle](https://orm.drizzle.team/) の [`src/db/schema.ts`](src/db/schema.ts) です。`drizzle-kit generate` が [`migrations/`](migrations/) に SQL を出し、[`cf d1 migrations`](https://developers.cloudflare.com/d1/reference/migrations/) が適用します。

Worker の設定は [`cloudflare.config.ts`](cloudflare.config.ts)（`cf` CLI）。ビルドは [`vite.config.ts`](vite.config.ts) の [`@cloudflare/vite-plugin`](https://developers.cloudflare.com/workers/vite-plugin/)（`2.0.0-beta.sha-8c6014f9a`）です。OG 用 `.woff` は Vite の `?url` インポートと `fetch` で読み込みます。

## 必要条件

- Node.js **22.18 以上**（`cf` が `cloudflare.config.ts` を読むため。リポジトリルートの `.nvmrc` は 22.19）
- pnpm 12.10.1（リポジトリルートの `packageManager`）

## Cloudflare CLI（`cf`）

開発・ビルド・デプロイは [`cf`](https://developers.cloudflare.com/cf/) を使います。

```sh
cd apps/web
pnpm run dev      # cf dev（ローカル D1 は --local 付きの db スクリプトと同じ永続化）
pnpm run build    # cf build
pnpm run deploy   # cf deploy
```

初回は `cf auth login` が必要です。CI では `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を渡します。

`cf` がまだないコマンドは `npx wrangler` で実行します（本リポジトリでは **`wrangler tail`** と **単体シークレットの `secret put`**）。詳細は [Wrangler から cf への移行](https://developers.cloudflare.com/cf/wrangler/) と [コマンド対応表](https://developers.cloudflare.com/cf/wrangler/reference/)。

## Cloudflare D1 の作成（本番）

1. `cloudflare.config.ts` の D1 `id` が `REPLACE_WITH_PRODUCTION_DATABASE_ID` のままなら、本番用 ID に差し替えます。`db:*` は [`scripts/db.mjs`](scripts/db.mjs) を呼ぶだけで、同じ ID を環境変数 `DATABASE_ID` から読みます（`db:generate` と `db:schema:check` を除く）。

```sh
export DATABASE_ID='xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
```

2. リモート DB を作成します。

```sh
cd apps/web
pnpm exec cf d1 create --name myblog-web
```

表示された ID を `cloudflare.config.ts` の `bindings.d1({ id: ... })` に書き込みます。

## セットアップと起動

リポジトリルートで依存を入れます。

```sh
corepack enable
pnpm install
```

### ローカル D1（開発）

1. 未適用のマイグレーションを確認してから適用します。

```sh
cd apps/web
pnpm run db:local:plan
pnpm run db:local:apply
```

2. 開発用の記事データを入れます（`seed.sql`。本番には流しません）。

```sh
pnpm run db:local:seed
```

3. 開発サーバー。

```sh
pnpm --filter @myblog/web dev
```

ブラウザで `http://localhost:8787/` を開きます。

### スキーマ変更（ローカル）

`src/db/schema.ts` を編集したあと、`pnpm run db:generate` で `migrations/` に SQL を追加します。`pnpm run db:local:plan` は未適用ファイルを一覧し、`pnpm run db:local:apply` が `cf d1 migrations apply --local` で適用します。適用済みは `d1_migrations` に記録されます。

### スキーマ変更（リモート）

1. 未適用のマイグレーションを確認します。

```sh
cd apps/web
pnpm run db:remote:plan
```

2. 問題なければ適用します。

```sh
pnpm run db:remote:apply
```

`db:remote:plan` は未適用のマイグレーションを一覧します。`db:remote:apply` は `cf d1 migrations apply`（リモート既定）で実行します。初回の `0000_init.sql` は `CREATE TABLE IF NOT EXISTS` なので、すでに `posts` があるデータベースでも適用できます。

## チェック

```sh
pnpm --filter @myblog/web typecheck
pnpm --filter @myblog/web run db:schema:check
```

## ルート

| パス | 内容 |
| --- | --- |
| `/` | 記事一覧（新しい順） |
| `/posts/:slug` | 記事詳細。存在しない slug は 404 |

記事の取得は `src/posts/repository.ts` の `listPosts` / `getPost`（D1 バインディング `DB`）経由です。

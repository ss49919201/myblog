# @myblog/web

Cloudflare Workers 上で動く Hono + JSX の SSR ブログ。記事は D1 に保存します。スキーマは [sqldef](https://github.com/sqldef/sqldef) の `sqlite3def` で管理します（D1 の migrations ディレクトリは使いません）。

Worker の設定は [`cloudflare.config.ts`](cloudflare.config.ts)（`cf` CLI）。`.woff` の Data ルールは [`wrangler.config.ts`](wrangler.config.ts)（Wrangler バンドラー）にあります。

## 必要条件

- Node.js **22.18 以上**（`cf` が `cloudflare.config.ts` を読むため。リポジトリルートの `.nvmrc` は 22.19）
- pnpm 12.10.1（リポジトリルートの `packageManager`）
- [`sqlite3def`](https://github.com/sqldef/sqldef/releases) **v3.11.26**（`apps/web/package.json` の `sqldefVersion` と揃える）

Linux / macOS の例（バイナリを PATH に置く）:

```sh
curl -sL "https://github.com/sqldef/sqldef/releases/download/v3.11.26/sqlite3def_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/').tar.gz" | tar xz
sudo mv sqlite3def /usr/local/bin/
sqlite3def --version
```

## Cloudflare CLI（`cf`）

開発・ビルド・デプロイは [`cf`](https://developers.cloudflare.com/cf/) を使います。

```sh
cd apps/web
pnpm run dev      # cf dev（ローカル D1 は --local 付きの db スクリプトと同じ永続化）
pnpm run build    # cf build
pnpm run deploy   # cf deploy
```

初回は `cf auth login` が必要です。CI では `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を渡します。

Wrangler バンドラー（`wrangler.config.ts`）を使うため、`cf dev` / `cf build` / `cf deploy` は **Wrangler 4.136 以上** をプロジェクトの dev 依存として必要です（[移行ガイド](https://developers.cloudflare.com/cf/wrangler/migrate/)）。本リポジトリでは CLI を `cf` に寄せ、`wrangler` パッケージは入れていません。ローカルで `cf build` する前に `pnpm add -D wrangler@4.149.0` するか、Vite バンドラーへ切り替えてください。

`cf` がまだないコマンドは `npx wrangler` で実行します（本リポジトリでは **D1 のスキーマ export**、`wrangler tail`、**単体シークレットの `secret put`**）。詳細は [Wrangler から cf への移行](https://developers.cloudflare.com/cf/wrangler/) と [コマンド対応表](https://developers.cloudflare.com/cf/wrangler/reference/)。

## Cloudflare D1 の作成（本番）

1. `cloudflare.config.ts` の D1 `id` が `REPLACE_WITH_PRODUCTION_DATABASE_ID` のままなら、本番用 ID に差し替えます（`package.json` の `db:*` スクリプト内の同じ文字列も揃えます）。`wrangler.jsonc` の `database_id` も export 用に同期します。
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

1. ローカル DB ファイルを用意する（初回のみ）。

```sh
cd apps/web
pnpm run db:local:touch
```

2. 差分を確認してから `schema.sql` を適用します（ローカル D1 は export → sqldef → `cf d1 raw --local`）。

```sh
pnpm run db:local:plan
pnpm run db:local:apply
```

3. 開発用の記事データを入れます（`seed.sql`。本番には流しません）。

```sh
pnpm run db:local:seed
```

4. 開発サーバー。

```sh
pnpm --filter @myblog/web dev
```

ブラウザで `http://localhost:8787/` を開きます。

### スキーマ変更（ローカル）

`schema.sql` を編集したあと、`pnpm run db:local:plan` で差分 DDL を確認し、`pnpm run db:local:apply` で適用します。ローカル D1 は内部メタデータテーブルを含むため、sqldef は SQLite ファイルを直接開かず、`npx wrangler d1 export --local` で export した SQL を `current` として差分計算します。`db:local:apply` は sqldef が出力する `BEGIN` / `COMMIT` を除いてから `cf d1 raw --local` に渡します。

### スキーマ変更（リモート）

1. 差分 DDL を確認します。

```sh
cd apps/web
pnpm run db:remote:plan
```

2. 問題なければ適用します。

```sh
pnpm run db:remote:apply
```

`db:remote:plan` は `npx wrangler d1 export --remote --no-data` で現在のスキーマを取り、`sqlite3def` の `--dry-run` でマイグレーション SQL を標準出力に出します。`db:remote:apply` はトランザクション行を除いた DDL を `/tmp/myblog-web-migrate.sql` に書き、`cf d1 query`（リモート既定）で実行します。

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

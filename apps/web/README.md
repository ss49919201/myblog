# @myblog/web

Cloudflare Workers 上で動く Hono + JSX の SSR ブログ。記事は D1 に保存します。スキーマは [sqldef](https://github.com/sqldef/sqldef) の `sqlite3def` で管理します（Wrangler の migrations は使いません）。

## 必要条件

- Node.js 22.12 以上（リポジトリルートの `.nvmrc`）
- pnpm 12.10.1（リポジトリルートの `packageManager`）
- [`sqlite3def`](https://github.com/sqldef/sqldef/releases) **v3.11.26**（`apps/web/package.json` の `sqldefVersion` と揃える）

Linux / macOS の例（バイナリを PATH に置く）:

```sh
curl -sL "https://github.com/sqldef/sqldef/releases/download/v3.11.26/sqlite3def_$(uname -s | tr '[:upper:]' '[:lower:]')_$(uname -m | sed 's/x86_64/amd64/').tar.gz" | tar xz
sudo mv sqlite3def /usr/local/bin/
sqlite3def --version
```

## Cloudflare D1 の作成（本番）

1. `wrangler.jsonc` の `database_id` が `REPLACE_WITH_PRODUCTION_DATABASE_ID` のままなら、本番用 ID に差し替えます。
2. リモート DB を作成します。

```sh
cd apps/web
pnpm exec wrangler d1 create myblog-web
```

表示された `database_id` を `wrangler.jsonc` の `d1_databases[0].database_id` に書き込みます。

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

2. 差分を確認してから `schema.sql` を適用します（ローカル D1 は export → sqldef → `wrangler d1 execute`）。

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

`schema.sql` を編集したあと、`pnpm run db:local:plan` で差分 DDL を確認し、`pnpm run db:local:apply` で適用します。Wrangler のローカル D1 は内部メタデータテーブルを含むため、sqldef は SQLite ファイルを直接開かず、export した SQL を `current` として差分計算します。`db:local:apply` は sqldef が出力する `BEGIN` / `COMMIT` を除いてから `wrangler d1 execute --local` に渡します。

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

`db:remote:plan` は `wrangler d1 export --remote --no-data` で現在のスキーマを取り、`sqlite3def` の `--dry-run` でマイグレーション SQL を標準出力に出します。`db:remote:apply` はトランザクション行を除いた DDL を `/tmp/myblog-web-migrate.sql` に書き、`wrangler d1 execute --remote --file` で実行します。

## チェック

```sh
pnpm --filter @myblog/web typecheck
pnpm --filter @myblog/web test
pnpm --filter @myblog/web run db:schema:check
```

テストは `@cloudflare/vitest-plugin` で Workers ランタイム上の D1 バインディングを使います。`schema.sql` は `applyD1Migrations` で一度適用し、各テストは `DELETE FROM posts` のあと必要な行だけ INSERT します。

## ルート

| パス | 内容 |
| --- | --- |
| `/` | 記事一覧（新しい順） |
| `/posts/:slug` | 記事詳細。存在しない slug は 404 |

記事の取得は `src/posts/repository.ts` の `listPosts` / `getPost`（D1 バインディング `DB`）経由です。

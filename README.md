# myblog

Hono で配信するブログです。記事は Markdown のままリポジトリに置きます。公開時にその内容を SQLite へ載せ、Cloudflare Workers と D1 が読みます。スキーマは [sqldef](https://github.com/sqldef/sqldef) の `sqlite3def` が `db/schema.sql` に合わせます。

入稿コマンド `blog` は Go のままです。

## ページ

- `/` 公開記事一覧
- `/posts/:slug` 記事
- `/categories/:slug` カテゴリ別の公開記事一覧
- `/feed.xml` RSS
- `/sitemap.xml` サイトマップ
- `/robots.txt`

`draft: true` の記事と、`date` が現在より未来の記事は、一覧、記事ページ、カテゴリ、RSS、サイトマップに出ません。未来の記事は日付を過ぎると、Worker をデプロイし直さなくても出ます。本文や frontmatter を変えたときは、データベースへ載せ直してください。

検索ページと OGP 画像はありません。タイトルと説明の Open Graph タグは残しています。

## 記事とカテゴリ

記事は `src/content/posts/`、カテゴリは `src/content/categories/` の Markdown です。

記事の frontmatter:

```yaml
title: Hello, world
slug: hello-world
date: 2026-10-03T00:00:00.000Z
category: news
draft: false
```

`date` は公開日時です。`slug` が URL（`/posts/<slug>`）になります。ファイル名と揃えてください。

カテゴリのファイル名（拡張子を除いたもの）が `/categories/<slug>` になります。

```yaml
name: お知らせ
```

`src/content.config.ts` は記事キーの一覧です。`blog check` は、このファイルがリポジトリのルートにあることを確認します。

## 入稿 CLI

リポジトリのルートで実行します。Go 1.22 以上が必要です。

```sh
go run ./cmd/blog new -title "Hello, world" -slug hello-world -category news
go run ./cmd/blog new -title "公開のお知らせ" -slug launch -date 2026-10-10T09:00:00+09:00 -draft=false
go run ./cmd/blog check
```

`blog new` は `src/content/posts/<slug>.md` に雛形を書き、そのパスを標準出力に出します。`-draft` の既定は `true` です。`-draft=false` で下書きを外します。`-date` を省くと、ローカルのタイムゾーンで秒未満を切り捨てた現在時刻を書きます。`-category` を省くと `category` キーを書きません。同じ slug のファイルが既にあるとき、相手が下書きでも作りません。2回目は最初のファイルを変えません。

`blog check` は記事が 0 件でも成功します。問題があるときは 1 行に 1 件を標準出力に書き、終了コード 1 で終わります。問題が無いときは何も書かず、終了コード 0 です。使い方が違うときは終了コード 2 です。

検証する規則:

- キーは `title` `slug` `date` `category` `draft` だけです。`title` `slug` `date` は必須です。`draft` を省くと false です
- `title: ""` は通ります。`title:` と `title: true` は通りません。`draft: true` と `draft: TRUE` は通ります。`draft: yes` は通りません
- `slug` は空でない 1 つのパス要素です。`.` と `..`、`/`、`\`、NUL は使えません。`日記` は使えます
- ファイルは `src/content/posts/<slug>.md` です
- `date` は `2006-01-02`、ゾーン無しの `2006-01-02T15:04:05`（UTC）、または `Z` か数値オフセット付きの RFC3339 です。`date: 2026` は通りません
- slug の重複は下書きも含めて失敗します
- `category` を書くときは `src/content/categories/<category>.md` が必要です。id はファイル名から取り、`name` は見ません

CI では `go vet`、`go test -race`、`go run ./cmd/blog check`、および `golang.org/x/tools/cmd/deadcode` を実行します（`.github/workflows/go.yml`）。

## データベース

`db/schema.sql` が望む状態です。テーブルは `categories` と `posts` です。`posts` には下書きと未来の記事も入り、表示するかどうかはリクエストの時刻で決めます。

ローカルのファイルは `db/blog.sqlite` です。初回の `npm run dev` または `npm run db:sync` が、sqlite3def 3.11.3 を `.tools/` にダウンロードします。

D1 へ載せるコマンドは `npm run db:push` です。ローカルの D1 へ載せるときは `npm run db:push -- --local` です。どちらも、いまの D1 スキーマと `db/schema.sql` の差分を sqlite3def で作り、そのあと記事を入れ替えます。同じコマンドを続けて実行しても結果は同じです。

## 必要条件

Node.js 22.12 以上（`.nvmrc` は 22.14.0）。Go の入稿には Go 1.22 以上。

## ローカル開発

```sh
npm ci
npm run dev
```

`http://localhost:8787` で開きます。正規 URL、RSS、サイトマップのオリジンは環境変数 `SITE` です。未設定時は `https://example.com` です。

Workers ランタイムとローカル D1 で見るときは、次を実行します。

```sh
npm run preview
```

## 本番 URL

`wrangler.jsonc` の `vars.SITE` が本番のオリジンです。デプロイ前に書き換えてください。

## デプロイ

1. `npx wrangler login`
2. `npx wrangler d1 create myblog`
3. 表示された `database_id` を `wrangler.jsonc` に書く
4. `vars.SITE` を本番オリジンにする
5. `npm run deploy`

`npm run deploy` はリモート D1 にスキーマと記事を載せてから Worker をデプロイします。記事だけの変更は `npm run db:push` で足ります。

## チェック

```sh
npm run typecheck
npm test
npm run knip
```

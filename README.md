# myblog

[Astro](https://astro.build) でビルド時に静的生成するブログです。ホスティングは Cloudflare Workers の静的アセットです。

- `/` 公開記事一覧
- `/posts/:slug` 記事
- `/categories/:slug` カテゴリ別の公開記事一覧
- `/search` [Pagefind](https://pagefind.app) によるクライアント側検索
- `/feed.xml` RSS
- `/sitemap-index.xml` サイトマップ
- `/robots.txt`

下書き（`draft: true`）と、`date` がビルド時刻より未来の記事はページを生成しません。一覧、カテゴリ、検索、RSS、サイトマップにも出ません。公開予約は、日付を過ぎてからビルドし直すことで反映します。

## 記事とカテゴリ

記事は `src/content/posts/`、カテゴリは `src/content/categories/` の Markdown です。

記事の frontmatter:

```yaml
title: Hello, world
slug: hello-world
date: 2026-10-03T00:00:00.000Z
category: news # src/content/categories/<id>.md。省略可
draft: false
```

`date` は公開日時です。`slug` が URL（`/posts/<slug>`）になります。ファイル名と揃えてください。

カテゴリのファイル名（拡張子を除いたもの）が `/categories/<slug>` になります。

```yaml
# src/content/categories/news.md
name: お知らせ
```

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

## 必要条件

Node.js 22.12 以上（`.nvmrc` は 22.14.0）。

## ローカル開発

```sh
npm ci
npm run dev
```

開発サーバーでは Pagefind の索引が無いため、検索結果は出ません。検索を確認するときはビルドしてプレビューします。

```sh
npm run build
npm run preview
```

## 本番 URL

正規 URL、OGP、RSS、サイトマップは `astro.config.ts` の `site` を使います。未設定時は環境変数 `SITE`、それも無いときは `https://example.com` です。デプロイ前に本番のオリジンへ変えてください。

```sh
SITE=https://myblog.example npm run build
```

## デプロイ

Cloudflare Workers の静的アセットとして配信します。Worker のスクリプト、D1、画像バインディングはありません。

1. `npx wrangler login`
2. 必要なら `wrangler.jsonc` の `name` を変える
3. `SITE` を本番オリジンにして `npm run deploy`

`npm run deploy` はビルド（Pagefind の索引作成を含む）のあと `wrangler deploy` します。不明なパスは `dist/404.html` を 404 で返します。

## チェック

```sh
npm run typecheck
npm run knip
```

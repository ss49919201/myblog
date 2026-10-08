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
go run ./cmd/blog check
```

`blog new` は `src/content/posts/<slug>.md` に雛形を作り、そのパスを標準出力に出します。既定は `draft: true` です。`-draft=false` で公開状態にします。`-date` を省略すると現在時刻（ローカルタイムゾーン、秒まで）を書きます。同じ slug の記事が既にあると、下書きでも作成しません。

`blog check` は記事の frontmatter を検証します。問題があるときは 1 行ずつ表示して終了コード 1 で終わります。検証内容は次のとおりです。

- キーは `title` `slug` `date` `category` `draft` のみ。`title` `slug` `date` は必須
- 値の型が Astro のスキーマと一致する（例: `draft: yes` は不可、`title: 2024` は不可）
- ファイルは `src/content/posts/<slug>.md` に置く（`slug` は 1 つのパス要素。日本語も可）
- `date` は `2026-10-03`、ゾーン無しの `2026-10-03T15:04:05`（UTC）、または `Z` / 数値オフセット付きの RFC3339
- slug は全記事で重複しない（下書きも含む）
- `category` は `src/content/categories/<id>.md` が存在する id を指す

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

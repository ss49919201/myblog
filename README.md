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

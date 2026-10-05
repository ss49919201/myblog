# myblog

Next.js App Router（[vinext](https://github.com/cloudflare/vinext)）+ Cloudflare Workers + Cloudflare D1 で動くブログ。

- `/` 公開記事一覧、`/posts/:slug` 記事詳細（Markdown）
- `/search?q=...` 公開記事のタイトル・本文検索（下書きは対象外）
- `/api/posts` 公開記事一覧の JSON

## ローカル開発

```sh
npm install
npm run db:migrate:local
npm run dev
```

ローカルの D1 は `.cloudflare/state` に保存されます。

## デプロイ

1. `npx cf auth login`
2. `npx cf d1 create` で D1 データベースを作成し、払い出された ID を `package.json` の `config.d1DatabaseId` に設定
3. `npm run db:migrate:remote`
4. `npm run deploy`

## スキーマ変更

`npx cf d1 migrations create <message>` で `migrations/` にファイルを追加し、`db:migrate:local` / `db:migrate:remote` で適用します。

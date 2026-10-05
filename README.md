# myblog

Next.js App Router（[vinext](https://github.com/cloudflare/vinext)）+ Cloudflare Workers + Cloudflare D1 で動くブログ。

- `/` 公開記事一覧、`/posts/:slug` 記事詳細（Markdown）
- `/categories/:slug` カテゴリー別の公開記事一覧
- `/api/posts` 公開記事一覧の JSON

## カテゴリー

カテゴリーは `categories` テーブルに保存し、記事は `posts.category_id` で 1 つのカテゴリーに属します（未設定も可）。
管理画面はないため、マイグレーションを追加して割り当てます。

```sql
INSERT INTO categories (slug, name) VALUES ('tech', '技術');

UPDATE posts
SET category_id = (SELECT id FROM categories WHERE slug = 'tech')
WHERE slug = 'my-post';
```

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

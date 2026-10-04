# myblog

Next.js App Router（[vinext](https://github.com/cloudflare/vinext)）+ Cloudflare Workers + Cloudflare D1 で動くブログ。

- `/` 公開記事一覧、`/posts/:slug` 記事詳細（Markdown）
- `/admin` 記事の作成・編集・削除（Basic 認証、パスワードは `ADMIN_PASSWORD`）
- `/api/posts` 公開記事一覧の JSON

## ローカル開発

```sh
npm install
echo 'ADMIN_PASSWORD=dev-password' > .dev.vars
npm run db:migrate:local
npm run dev
```

ローカルの D1 は `.cloudflare/state` に保存されます。管理画面のユーザー名は任意です。

## デプロイ

1. `npx cf auth login`
2. `npx cf d1 create` で D1 データベースを作成し、払い出された ID を `package.json` の `config.d1DatabaseId` に設定
3. `npm run db:migrate:remote`
4. `ADMIN_PASSWORD` を Worker のシークレットとして登録
5. `npm run deploy`

## スキーマ変更

`npx cf d1 migrations create <message>` で `migrations/` にファイルを追加し、`db:migrate:local` / `db:migrate:remote` で適用します。

# blog-admin

記事を D1 の `posts` テーブルへ入稿する Cloudflare Worker です。公開サイト（`apps/web`）とは別アプリに分け、**Cloudflare Access** で本人のみがフォームを開ける前提です（Access が前段で認証し、Worker はその内側で動きます）。

## 前提

- `apps/web` と同じ D1 データベース（`blog-web`）をバインドします。
- スキーマの正本は `apps/web/src/db/schema.ts` です。Drizzle Kit が生成したマイグレーションを `cf d1 migrations` で本番・ローカルに適用します。

## Cloudflare Access の設定

1. Zero Trust で **Self-hosted** アプリケーションを作成し、admin Worker のホスト名だけをカバーします。
2. **Policy** で本人のメールアドレス（または IdP グループ）だけを Allow にします。
3. `workers.dev` の URL をそのまま公開しないでください。Access 付きのカスタムドメイン（または Access 対象ホスト）を使います。

## 変数

| 名前 | 種別 | 説明 |
|------|------|------|
| `PUBLIC_WEB_URL` | var | 公開サイトの origin（成功時に記事 URL を組み立てる） |
| D1 `DB` | binding | `apps/web` と同じ database ID |

[`cloudflare.config.ts`](cloudflare.config.ts) の `PUBLIC_WEB_URL` を本番値に差し替え、`DATABASE_ID` に本番 D1 の ID を渡してから `pnpm run deploy`（`cf deploy`）します（`apps/web` と同じ ID）。

単体シークレットは `cf` 未対応のため `npx wrangler secret put <NAME> --name blog-admin` を使います（[参考](https://developers.cloudflare.com/cf/wrangler/reference/)）。

## CSRF

`hono/csrf` ミドルウェアで POST を保護します（`Origin` / `Sec-Fetch-Site`）。通常のブラウザフォーム送信はそのまま通ります。

## スキーマの適用

`body_md` 列の追加などは `apps/web` で行います。

```bash
cd apps/web
pnpm run db:local:plan
pnpm run db:local:apply
pnpm run db:remote:plan
pnpm run db:remote:apply
```

## 開発

```bash
pnpm install
pnpm --filter @blog/admin dev
```

ビルドとデプロイは `pnpm --filter @blog/admin run build` / `run deploy`（`cf build` / `cf deploy`）。Vite 設定は [apps/web](../web) と同様 `@cloudflare/vite-plugin` です。

## テスト

```bash
pnpm --filter @blog/admin test
pnpm --filter @blog/admin typecheck
```

## Markdown の扱い

入稿時に `markdown-it`（`html: false`）で `body_html` を生成して D1 に保存します。公開 Worker は HTML をそのまま表示し、原文は `body_md` に保存します。

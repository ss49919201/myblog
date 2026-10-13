# myblog-admin

記事を D1 の `posts` テーブルへ入稿する Cloudflare Worker です。公開サイト（`apps/web`）とは別アプリに分け、**Cloudflare Access** で本人のみがフォームを開ける前提です（Access が前段で認証し、Worker はその内側で動きます）。

## 前提

- `apps/web` と同じ D1 データベース（`myblog-web`）をバインドします。
- スキーマは `apps/web/schema.sql` のみを正本とし、sqldef で本番・ローカルに適用します。

## Cloudflare Access の設定

1. Zero Trust で **Self-hosted** アプリケーションを作成し、admin Worker のホスト名だけをカバーします。
2. **Policy** で本人のメールアドレス（または IdP グループ）だけを Allow にします。
3. `workers.dev` の URL をそのまま公開しないでください。Access 付きのカスタムドメイン（または Access 対象ホスト）を使います。

## 変数

| 名前 | 種別 | 説明 |
|------|------|------|
| `PUBLIC_WEB_URL` | var | 公開サイトの origin（成功時に記事 URL を組み立てる） |
| D1 `DB` | binding | `apps/web` と同じ database ID |

[`cloudflare.config.ts`](cloudflare.config.ts) の `PUBLIC_WEB_URL` と D1 `id` を本番値に差し替えてから `pnpm run deploy`（`cf deploy`）します。

単体シークレットは `cf` 未対応のため `npx wrangler secret put <NAME> --name myblog-admin` を使います（[参考](https://developers.cloudflare.com/cf/wrangler/reference/)）。

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
pnpm --filter @myblog/admin dev
```

ビルドとデプロイは `pnpm --filter @myblog/admin run build` / `run deploy`（`cf build` / `cf deploy`）。Vite 設定は [apps/web](../web) と同様 `@cloudflare/vite-plugin` です。

## テスト

```bash
pnpm --filter @myblog/admin test
pnpm --filter @myblog/admin typecheck
```

## Markdown の扱い

入稿時に `markdown-it`（`html: false`）で `body_html` を生成して D1 に保存します。公開 Worker は HTML をそのまま表示し、原文は `body_md` に保存します。

# myblog-admin

記事を D1 の `posts` テーブルへ入稿する Cloudflare Worker です。公開サイト（`apps/web`）とは別アプリに分け、Cloudflare Access で本人のみがフォームを開けます。

## 前提

- `apps/web` と同じ D1 データベース（`myblog-web`）をバインドします。
- スキーマは `apps/web/schema.sql` のみを正本とし、sqldef で本番・ローカルに適用します（このパッケージ単体では migrations を持ちません）。

## Cloudflare Access の設定

1. Zero Trust で **Self-hosted** アプリケーションを作成し、admin Worker のホスト名（カスタムドメインまたは `*.workers.dev` ではなく、Access 付きのホスト）だけをカバーします。
2. **Policy** で本人のメールアドレス（または IdP グループ）だけを Allow にします。
3. アプリの **Application Audience (AUD) Tag** を控え、`CF_ACCESS_AUD` に設定します。
4. チームドメイン（`xxxx.cloudflareaccess.com`）を `CF_ACCESS_TEAM_DOMAIN` に設定します。

`workers.dev` のデフォルト URL だけでは Access が付かないため、本番ではカスタムドメインまたは Access 対象ホストを使い、Worker 側でも `Cf-Access-Jwt-Assertion` を検証します（JWT が無い・不正なら 403）。

## 変数とシークレット

| 名前 | 種別 | 説明 |
|------|------|------|
| `CF_ACCESS_TEAM_DOMAIN` | var | 例: `myteam.cloudflareaccess.com` |
| `CF_ACCESS_AUD` | var | Access アプリの AUD タグ |
| `PUBLIC_WEB_URL` | var | 公開サイトの origin（成功時に記事 URL を組み立てる） |
| D1 `DB` | binding | `apps/web` と同じ `database_id` |

`wrangler.jsonc` の `vars` と `d1_databases.database_id` を本番値に差し替えてから `wrangler deploy` します。

リポジトリ同梱の `test-team.cloudflareaccess.com` はローカル開発・テスト用です。本番では必ず実チームドメインに変更してください（変更後は Cloudflare の公開 JWKS を取得します）。

## Markdown の扱い

入稿時に `markdown-it`（`html: false`）で `body_html` を生成して D1 に保存します。公開 Worker は HTML をそのまま表示するため、表示時変換は行いません。原文は `body_md` に保存し、将来の編集 UI に備えます。

## スキーマの適用

`body_md` 列の追加などは `apps/web` で行います。

```bash
cd apps/web
pnpm run db:local:plan    # ローカル
pnpm run db:local:apply
pnpm run db:remote:plan   # 本番
pnpm run db:remote:apply
```

## 開発

```bash
pnpm install
pnpm --filter @myblog/admin dev
```

## テスト

```bash
pnpm --filter @myblog/admin test
pnpm --filter @myblog/admin typecheck
```

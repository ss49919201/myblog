# @myblog/admin

Cloudflare Workers 上の記事入稿 UI。Hono + JSX の SSR で、タイトルと Markdown 本文を D1 の `posts` に INSERT します。公開サイトは `@myblog/web` と同じ D1 バインディング `myblog-web` を使います。スキーマは `apps/web/schema.sql` を sqldef で共有します。

## 必要条件

- Node.js 22.12 以上（リポジトリルートの `.nvmrc`）
- pnpm 12.10.1
- [`sqlite3def`](https://github.com/sqldef/sqldef/releases) **v3.11.26**（スキーマ適用時。手順は `apps/web/README.md` と同じ）

## 環境変数とシークレット

`wrangler.jsonc` の `vars` を本番値に差し替えます。

| 名前 | 種別 | 説明 |
| --- | --- | --- |
| `CF_ACCESS_TEAM_DOMAIN` | var | Cloudflare Access のチームドメイン（例: `myteam.cloudflareaccess.com`）。JWT 検証用 JWKS を `https://<domain>/cdn-cgi/access/certs` から取得します。 |
| `CF_ACCESS_AUD` | var | Access アプリケーションの **Application AUD** タグ。JWT の `aud` と一致させます。 |
| `PUBLIC_WEB_ORIGIN` | var | 公開ブログのオリジン（例: `https://blog.example.com`）。入稿成功時に `/posts/<slug>` の URL を表示します。 |
| `ACCESS_JWKS_JSON` | var | 本番では空文字のまま。ローカル vitest 用にテスト JWKS を注入します（`pretest` で生成）。 |

D1 の `database_id` は `@myblog/web` と同じ本番 ID に揃えます。

## Cloudflare Access の設定

1. Zero Trust で **Self-hosted** アプリケーションを作成し、admin Worker のホスト（カスタムドメインと `*.workers.dev` の両方をカバーするポリシー）を保護対象にします。
2. ポリシーで本人のみ許可（メールや IdP グループ）します。
3. アプリケーション詳細の **Application AUD** を `CF_ACCESS_AUD` にコピーします。
4. チームドメインを `CF_ACCESS_TEAM_DOMAIN` に設定します。

Access が付与する `Cf-Access-Jwt-Assertion` を Worker 側でも検証するため、`workers.dev` の URL だけを知っていても JWT なしでは 403 になります。

## スキーマの適用

スキーマの正本は `apps/web/schema.sql` です。`body_md` 列を追加した場合などは、まず `apps/web` の README にある `db:remote:plan` / `db:remote:apply` で本番 D1 を更新してください。admin は同じ DB を参照するだけです。

ローカル開発で web と admin を同じローカル D1 を使う場合:

```sh
cd apps/web
pnpm run db:local:touch
pnpm run db:local:apply
```

## 開発

```sh
corepack enable
pnpm install
cd apps/admin
pnpm run dev
```

本番と同様に Access 経由で開くか、テスト用 JWT を `Cf-Access-Jwt-Assertion` ヘッダに付けてリクエストします（`pnpm test` の `test/jwt-helpers.ts` が参考になります）。

## チェック

リポジトリルート:

```sh
pnpm run check:apps
```

admin 単体:

```sh
pnpm --filter @myblog/admin typecheck
pnpm --filter @myblog/admin test
pnpm --filter @myblog/admin run db:schema:check
```

## ルート

| パス | 内容 |
| --- | --- |
| `GET /` | 入稿フォーム（要 Access JWT） |
| `POST /` | 入稿処理（CSRF + JWT） |

一覧・編集・削除はスコープ外です。

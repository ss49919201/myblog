# myblog

## Hono SSR (`apps/web`)

Cloudflare Workers 上で Hono の JSX により記事一覧と詳細を SSR します（記事は D1）。ローカル開発とデプロイは Cloudflare の [`cf` CLI](https://developers.cloudflare.com/cf/) を使います。

```sh
corepack enable
pnpm install
pnpm --filter @myblog/web dev
```

`http://localhost:8787/` で確認します。Node.js は **22.18 以上**（`.nvmrc`）。型チェックは `pnpm --filter @myblog/web typecheck` です。詳細は [apps/web/README.md](apps/web/README.md) です。

入稿用 Worker は [apps/admin/README.md](apps/admin/README.md) です。

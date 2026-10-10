# myblog

## Hono SSR (`apps/web`)

Cloudflare Workers 上で Hono の JSX により記事一覧と詳細を SSR します（記事はモックデータ）。

```sh
corepack enable
pnpm install
pnpm --filter @myblog/web dev
```

`http://localhost:8787/` で確認します。型チェックとテストは `pnpm --filter @myblog/web typecheck` と `pnpm --filter @myblog/web test` です。詳細は [apps/web/README.md](apps/web/README.md) です。

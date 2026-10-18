# myblog verification map

This directory is the maintained source for verifying user-facing behavior of the myblog Workers (`apps/web` public SSR blog and `apps/admin` compose form). Read the index before driving the app, then open the matching feature file as the recipe.

## Baseline preconditions

- Node.js **22.18+** (see repo `.nvmrc`; `verify-myblog` uses nvm when available).
- `sqlite3def` on `PATH` (see `apps/web/README.md`).
- `pnpm install` at the repo root.
- Run `.cursor/skills/verify-myblog/scripts/verify-myblog launch` so both Workers share one isolated local D1 persist directory (`MYBLOG_PERSIST_STATE`).
- Default URLs: web `http://localhost:5173`, admin `http://localhost:5174` (use `localhost`, not `127.0.0.1`, when Vite listens on `::1` only).
- Never hit remote Cloudflare (`--remote`, deploy, or production Access). Local D1 only.
- Never drive Workers you did not start in this verification run.

## Driving conventions

- Use `verify-myblog doctor` before every drive when anything looks wrong.
- Prefer stable handles from the feature files (`#title`, `公開する`, route paths).
- Admin local runs use the fixture JWT in `fixtures/local-access-jwt.txt` as `CF-Access-Jwt-Assertion` for harness parity only. Production Access is edge-only; the admin Worker does not validate that header locally.
- Restore or remove scratch admin `.dev.vars` during cleanup; do not delete evidence under `artifacts/verify-myblog/`.

## Proof and skip reporting

- Capture the user action and the resulting state, not only the final screen.
- HTTP proof includes status codes and saved bodies or PNG bytes on disk.
- Browser proof includes `admin-success.png` and HTML snapshots.
- Mutation proof includes the new post on the public web and its OG PNG.
- Record the feature id and entry point with every artifact bundle (`summary.json`).

## Feature entry contract

Each feature file uses exactly four H2 sections: `Sub-features`, `How to get to it (user POV)`, `Driving it with verify-myblog`, and `Gotchas`.

## Features

- [Post list](./post-list.md) covers the public home page and seeded articles.
- [Post detail](./post-detail.md) covers `/posts/:slug` rendering.
- [OG images](./og-images.md) covers `/og/site.png` and `/og/posts/<slug>.png`.
- [Submit post](./submit-post.md) covers the admin compose form writing to D1 and the post appearing on web.

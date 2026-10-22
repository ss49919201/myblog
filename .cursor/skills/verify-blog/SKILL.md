---
name: verify-blog
description: "Drive the blog Cloudflare Workers locally (apps/web SSR + apps/admin compose) with isolated local D1, browser and HTTP evidence. Use after UI or D1 changes, or when you need proof beyond unit tests."
---

# verify-blog

Agents use this skill to prove blog behavior on the real local Workers stack. It never touches production Cloudflare or remote D1.

## Launch

From the repo root, with Node 22.18+ available (nvm + `.nvmrc` recommended):

```bash
.cursor/skills/verify-blog/scripts/verify-blog launch
```

This command:

1. Creates `artifacts/verify-blog/<BLOG_VERIFY_RUN_ID>/` with an isolated D1 persist directory.
2. Applies `apps/web/migrations` and `apps/web/seed.sql` into that persist path via `node scripts/db.mjs local apply` and `local seed` (`DATABASE_ID` from `cloudflare.config.ts`, `BLOG_PERSIST_STATE` set).
3. Writes `apps/admin/.dev.vars` with `PUBLIC_WEB_URL` pointing at the local web origin (restored on cleanup).
4. Starts `pnpm run dev` for `@blog/web` and `cf dev --port 5174` for `@blog/admin` in dedicated tmux sessions, both with `BLOG_PERSIST_STATE` set so Vite shares the same D1 files.
5. Waits until `GET /` returns `200` on web (`http://localhost:5173` by default) and admin (`http://localhost:5174`). Vite binds to `localhost` (IPv6); use `localhost`, not `127.0.0.1`, in this environment.

Ready when both URLs answer `200` and `state.env` exists under the run directory.

Teardown is `verify-blog cleanup` (see Cleanup).

## Doctor

```bash
.cursor/skills/verify-blog/scripts/verify-blog doctor
```

Read-only checks:

- Web and admin tmux sessions from `state.env` still exist.
- `GET /` on both ports returns `200`.
- The persist directory still contains `v3/d1`.

Run this before any drive when ports, D1, or processes might be stale.

## Drive

Read `.cursor/skills/verify-blog/features/README.md` and the feature file you need.

```bash
.cursor/skills/verify-blog/scripts/verify-blog drive submit-post
```

`drive submit-post` (default) uses Playwright Chromium against the admin form with `CF-Access-Jwt-Assertion` set to `fixtures/local-access-jwt.txt` (local harness only, not production Access). It then fetches the new post on web and its OG PNG.

Other features in the map can be driven with the curl recipes in their feature files while the same launch is up.

## Evidence

Proof artifacts live at:

`artifacts/verify-blog/<BLOG_VERIFY_RUN_ID>/evidence/`

A successful `drive submit-post` writes at least:

- `admin-success.png`, `admin-success.html`
- `web-home.html`, `web-post.html`
- `og-post.png`
- `summary.json` (status codes, slug, URLs, byte sizes)

Standards:

- Exercise public routes and the admin form, not internal repositories directly.
- Assert D1 side effects via the public web and OG output.
- Keep artifacts after cleanup.

## Cleanup

```bash
.cursor/skills/verify-blog/scripts/verify-blog cleanup
```

Stops the tmux sessions recorded in `state.env`, removes the isolated persist directory, and restores or removes the temporary `apps/admin/.dev.vars`. Evidence under `artifacts/verify-blog/<run>/evidence/` is kept.

Never `killall` by process name. Only stop sessions this skill started.

## Helpers

| Script | Purpose |
| --- | --- |
| `.cursor/skills/verify-blog/scripts/verify-blog` | `launch`, `doctor`, `drive`, `cleanup` |
| `.cursor/skills/verify-blog/scripts/drive-submit-post.mjs` | Playwright + HTTP proof for `submit-post` |
| `.cursor/skills/verify-blog/fixtures/local-access-jwt.txt` | Local Access JWT header value for admin browser drives |

Optional env vars: `BLOG_VERIFY_RUN_ID`, `BLOG_WEB_PORT`, `BLOG_ADMIN_PORT`.

`BLOG_PERSIST_STATE` is set automatically during launch and must match on both Workers. `apps/web/vite.config.ts` and `apps/admin/vite.config.ts` honor it via `persistState` when present.

Maintain the feature map with `/maintain-verification-skill`.

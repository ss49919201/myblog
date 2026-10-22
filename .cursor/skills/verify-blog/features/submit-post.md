# Submit post

An authorized user opens the admin compose form, enters title and Markdown body, and publishes a new post into D1. The public site lists the new article.

## Sub-features

- `submit-form` loads the compose page.
- `submit-save` persists a new row and shows `公開しました。`
- `submit-web` exposes the post on the public web and OG PNG.

## How to get to it (user POV)

- Open the admin Worker URL (production sits behind Cloudflare Access; local `cf dev` has no Access gate).
- Fill `タイトル` and `本文（Markdown）`, then choose `公開する`.

## Driving it with verify-blog

Preconditions:

- `verify-blog launch` started web and admin against the same `BLOG_PERSIST_STATE`.
- `verify-blog doctor` passes.

- **End-to-end publish.** `.cursor/skills/verify-blog/scripts/verify-blog drive submit-post` fills the form in Chromium with the local Access JWT header, saves evidence under `artifacts/verify-blog/<run>/evidence/`, and writes `summary.json` with HTTP `200` for web post and OG PNG.

## Gotchas

- `hono/csrf` requires a real browser form POST or same-origin `Origin` / `Sec-Fetch-Site` headers.
- `PUBLIC_WEB_URL` in `cloudflare.config.ts` controls the success link text; local proof should assert the public web, not that link hostname.
- Do not use production Cloudflare Access cookies or real JWTs in local runs.

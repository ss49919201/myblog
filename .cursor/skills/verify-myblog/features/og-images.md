# OG images

Social preview images are served as PNGs at `/og/site.png` and `/og/posts/<slug>.png`.

## Sub-features

- `og-site` renders the site-wide card.
- `og-post` renders a card titled from the D1 post for an existing slug.

## How to get to it (user POV)

- Follow `og:image` meta tags on pages, or request the PNG paths directly.

## Driving it with verify-myblog

Preconditions:

- `verify-myblog doctor` passes.
- Target slug exists in local D1 (seed or a post created via admin).

- **Site OG.** `curl -sS -o artifacts/og-site.png -w '%{http_code}\n' "$MYBLOG_WEB_URL/og/site.png"` prints `200` and writes a PNG larger than 1 KB.

- **Post OG.** `curl -sS -o artifacts/og-post-seed.png -w '%{http_code}\n' "$MYBLOG_WEB_URL/og/posts/hello-hono.png"` prints `200` and writes a PNG larger than 1 KB.

## Gotchas

- Paths must include the `.png` suffix (`/og/posts/:slug` route expects it).
- OG font assets are resolved against the request origin; a broken relative font URL surfaces as `500` on OG routes.

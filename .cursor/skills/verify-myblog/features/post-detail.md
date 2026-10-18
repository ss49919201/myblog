# Post detail

A visitor opens a single post at `/posts/:slug` with title, body HTML, and metadata.

## Sub-features

- `detail-known` renders a seeded slug such as `hello-hono`.
- `detail-missing` returns the 404 page for unknown slugs.

## How to get to it (user POV)

- Click a post title on the home page, or navigate directly to `/posts/<slug>`.

## Driving it with verify-myblog

Preconditions:

- `verify-myblog doctor` passes.
- Local D1 includes seed data.

- **Open seeded post.** `curl -sS -o artifacts/post-detail.html -w '%{http_code}\n' "$MYBLOG_WEB_URL/posts/hello-hono"` prints `200` and HTML whose `<title>` contains `Hono JSX で SSR を始める`.

## Gotchas

- Slugs are case-sensitive in URLs.

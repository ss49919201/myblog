# Post list

The public home page lists blog posts newest first, each linking to its detail page.

## Sub-features

- `list-home` renders the article index at `/`.
- `list-seed` shows seeded posts after `seed.sql` is applied to local D1.

## How to get to it (user POV)

- Open the site root `/` in a browser.

## Driving it with verify-myblog

Preconditions:

- `verify-myblog doctor` passes for web `MYBLOG_WEB_URL`.

- **Load index.** `curl -sS -o artifacts/post-list-home.html -w '%{http_code}\n' "$MYBLOG_WEB_URL/"` exits `0` with status `200` and HTML containing `記事一覧` and `post-list`.

## Gotchas

- A `500` on `/` usually means local D1 was not seeded into the same persist directory as `cf dev` (`MYBLOG_PERSIST_STATE`).

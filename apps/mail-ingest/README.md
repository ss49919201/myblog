# mail-ingest

Cloudflare Email Worker that turns inbound mail into a GitHub pull request adding `content/posts/<slug>.md`. Nothing is published until someone merges the PR; `sync-d1` on `main` then syncs posts to D1.

## Architecture

- **Email Routing** delivers messages to this worker’s `email()` handler.
- **Validation** checks sender allowlist, `Authentication-Results` (DKIM pass and SPF or DMARC pass), and size limits.
- **Parsing** uses `postal-mime`. The post body must be `text/plain` Markdown. HTML-only mail is rejected so raw HTML never lands in the repo.
- **GitHub** uses a fine-grained PAT (see below) with `contents:write` and `pull_requests:write` only. The worker creates a branch, commits the markdown file, and opens a PR to `main`.

## Cloudflare setup

1. Deploy the worker: `pnpm --filter @myblog/mail-ingest exec wrangler deploy` (from repo root after `pnpm install`).
2. In **Email Routing** for your zone, add a custom address (for example `blog@yourdomain.com`) and set the action to **Send to Worker** → `myblog-mail-ingest`.
3. Set secrets and vars (dashboard or `wrangler secret put`):

| Name | Description |
|------|-------------|
| `GITHUB_TOKEN` | Fine-grained PAT (see permissions) |
| `GITHUB_OWNER` | GitHub user or org |
| `GITHUB_REPO` | Repository name (for example `myblog`) |
| `ALLOWED_SENDERS` | Comma-separated allowed `From` addresses |

## GitHub token

Use a **fine-grained personal access token** scoped to this repository only, with:

- **Contents**: Read and write
- **Pull requests**: Read and write

A GitHub App would be better for rotation and audit at org scale, but for a single-repo mail drop a fine-grained PAT is simpler to configure in Workers (one secret, no JWT or installation ID wiring) and matches the least privilege you asked for.

## Authoring mail

- **Subject** → `title` in frontmatter.
- **Body** → Markdown (`text/plain`). **Slug** is always `YYYYMMDD-<id>` from the receive date and a short id (message id seed), never taken from the body.
- If the body starts with a `---` … `---` YAML block (for example a pasted post file), that block is **removed** from the stored body. The repo file already gets canonical `title`, `slug`, and `published_at` from the mail; leaving the pasted block would show stale duplicate metadata in the PR diff.
- **Received time** → `published_at` (UTC ISO).
- If `content/posts/<slug>.md` already exists on `main`, the message is rejected (no overwrite).

## Development

```bash
pnpm install
pnpm --filter @myblog/mail-ingest typecheck
pnpm --filter @myblog/mail-ingest test
pnpm --filter @myblog/mail-ingest run deploy:dry-run
```

Tests include a temporary post file validated with `go run ./cmd/blog check` from `tools/`.

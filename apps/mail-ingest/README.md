# mail-ingest

Cloudflare Email Worker that turns inbound mail into a GitHub pull request adding `content/posts/<slug>.md`. Nothing is published until someone merges the PR; `sync-d1` on `main` then syncs posts to D1.

## Architecture

- **Email Routing** delivers messages to this worker’s `email()` handler.
- **Validation** checks sender allowlist, aligned SPF/DKIM/DMARC from Cloudflare’s MX, and size limits.
- **Parsing** uses `postal-mime`. The post body must be `text/plain` Markdown. HTML-only mail is rejected so raw HTML never lands in the repo.
- **GitHub** uses a fine-grained PAT (see below) with `contents:write` and `pull_requests:write` only. The worker creates a branch, commits the markdown file, and opens a PR to `main`.

## Mail authentication

Cloudflare Email Routing checks SPF, DKIM, and DMARC on inbound mail and records the result on **`ARC-Authentication-Results`** with authserv-id **`mx.cloudflare.net`** ([Cloudflare blog](https://blog.cloudflare.com/email-routing-subdomains/)). Some messages also include **`Authentication-Results`** from the same host.

This worker **only parses lines whose authserv-id is `mx.cloudflare.net`**. If several such lines exist, it uses the **last** one so a prepended `Authentication-Results: attacker.example; dkim=pass` cannot satisfy checks.

Auth must **align with the header `From` domain**:

- **`dmarc=pass`** and `header.from=` matches the domain of the header `From` address, or
- **`dkim=pass`** and `header.d=` (or `header.i=`) matches that domain.

SPF pass alone is not enough. That blocks mail where an attacker’s domain passes DKIM and SPF but the visible `From` is your allowlisted address.

### Allowlist and addresses

- **`ALLOWED_SENDERS`** is matched against the **header `From`** (the author identity in the message).
- **`message.from`** (SMTP envelope / `MAIL FROM`) must be the **same mailbox** as header `From`. If they differ, the message is rejected. Legitimate blog mail should use the same address in both places.

## Cloudflare setup

1. Deploy the worker: `pnpm --filter @myblog/mail-ingest exec wrangler deploy` (from repo root after `pnpm install`).
2. In **Email Routing** for your zone, add a custom address (for example `blog@yourdomain.com`) and set the action to **Send to Worker** → `myblog-mail-ingest`.
3. Set secrets and vars (dashboard or `wrangler secret put`):

| Name | Description |
|------|-------------|
| `GITHUB_TOKEN` | Fine-grained PAT (see permissions) |
| `GITHUB_OWNER` | GitHub user or org |
| `GITHUB_REPO` | Repository name (for example `myblog`) |
| `ALLOWED_SENDERS` | Comma-separated allowed header `From` addresses |

## GitHub token

Use a **fine-grained personal access token** scoped to this repository only, with:

- **Contents**: Read and write
- **Pull requests**: Read and write

A GitHub App would be better for rotation and audit at org scale, but for a single-repo mail drop a fine-grained PAT is simpler to configure in Workers (one secret, no JWT or installation ID wiring) and matches the least privilege you asked for.

## Authoring mail

- **Subject** → `title` in frontmatter.
- **Body** → Markdown (`text/plain`) stored as-is. Slug is always `YYYYMMDD-<id>` from receive time and a short id. If the body accidentally contains YAML frontmatter, fix it in the PR before merge.
- **Received time** → `published_at` (UTC ISO).
- If `content/posts/<slug>.md` already exists on `main`, the message is rejected (no overwrite).

## Development

```bash
pnpm install
pnpm --filter @myblog/mail-ingest typecheck
pnpm --filter @myblog/mail-ingest test
pnpm --filter @myblog/mail-ingest run deploy:dry-run
```

Tests include a temporary post file validated with `go run ./cmd/blog check` from `tools/` in CI.

# myblog tools

リポジトリルート向けの Go CLI です。`go build -o blog ./cmd/blog` でビルドできます。

## blog sync

Markdown を [goldmark](https://github.com/yuin/goldmark)（GFM）と [goldmark-meta](https://github.com/yuin/goldmark-meta) で HTML に変換し、Cloudflare D1 の `posts` テーブルへ upsert します。

frontmatter（YAML）には `title`、`slug`、`published_at` が必須です。`published_at` は `2006-01-02`、ゾーン無しの `2006-01-02T15:04:05`、または RFC3339 です。

### 認証

次のいずれかで指定します。

| フラグ | 環境変数 |
| --- | --- |
| `--account-id` | `CLOUDFLARE_ACCOUNT_ID` |
| `--database-id` | `CLOUDFLARE_D1_DATABASE_ID` |
| `--api-token` | `CLOUDFLARE_API_TOKEN` |

### 例

```bash
cd tools
go run ./cmd/blog sync --dry-run path/to/post.md

export CLOUDFLARE_ACCOUNT_ID=...
export CLOUDFLARE_D1_DATABASE_ID=...
export CLOUDFLARE_API_TOKEN=...
go run ./cmd/blog sync src/content/posts/hello-world.md
```

`--dry-run` では生成した HTML とパラメータ付き SQL を標準出力に出し、API は呼びません。

## その他のコマンド

- `blog new` … `src/content/posts/<slug>.md` の雛形（`date` キー）
- `blog check` … 記事 frontmatter の検証

`new` / `check` は Astro 向けの `date` キーを使います。D1 へ載せる Markdown は `sync` 用に `published_at` を付けてください。

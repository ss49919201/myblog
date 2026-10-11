# myblog tools

リポジトリルート向けの Go CLI です。`go build -o blog ./cmd/blog` でビルドできます。

## 記事の置き場所

記事は `content/posts/<slug>.md` に置きます（`--posts-dir` で変更可能）。frontmatter（YAML）の必須キーは `title`、`slug`、`published_at` です。`published_at` は `2006-01-02`、ゾーン無しの `2006-01-02T15:04:05`、または RFC3339 です。

## blog check

`content/posts` 内の Markdown を検証します。

```bash
cd tools
go run ./cmd/blog check
```

## blog sync

`content/posts` 内の `.md` をすべて読み、HTML に変換して Cloudflare D1 の `posts` テーブルへ upsert します。slug の重複は D1 書き込み前にエラーにします。1 件失敗しても残りは処理し、最後に成功件数と失敗件数を stderr に出します。

| フラグ | 説明 |
| --- | --- |
| `--posts-dir` | 記事ディレクトリ（既定 `content/posts`） |
| `--dry-run` | HTML と SQL を表示するだけ（D1 へ書き込まない） |
| `--prune` | ディレクトリに無い slug を D1 から削除（`--dry-run` では削除対象のみ表示） |

### 認証

本番書き込み、または `--prune`（一覧取得が必要）では次を指定します。

| フラグ | 環境変数 |
| --- | --- |
| `--account-id` | `CLOUDFLARE_ACCOUNT_ID` |
| `--database-id` | `CLOUDFLARE_D1_DATABASE_ID` |
| `--api-token` | `CLOUDFLARE_API_TOKEN` |

`--dry-run` だけなら認証は不要です。

```bash
go run ./cmd/blog sync --dry-run
go run ./cmd/blog sync --dry-run --prune   # D1 の一覧取得が必要
```

## blog new

`content/posts/<slug>.md` の雛形を作ります。

```bash
go run ./cmd/blog new -title "タイトル" -slug my-post -published-at 2026-10-03T00:00:00Z
```

## 将来の CI 同期（今回は未実装）

main への push で自動 `blog sync` する場合、GitHub Actions のシークレットに `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_D1_DATABASE_ID`、`CLOUDFLARE_API_TOKEN`（D1 書き込み権限）を登録し、workflow で `go run ./tools/cmd/blog sync` を実行します。`--prune` を使う場合は削除権限もトークンに含めてください。

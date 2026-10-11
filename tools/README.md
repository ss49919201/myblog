# myblog tools

リポジトリ向けの Go CLI やスクリプトを置くディレクトリです。

記事の正本は Cloudflare D1 にあり、入稿は admin Worker（`apps/admin`）から行います。以前の `content/posts` と `blog` CLI（`check` / `new` / `sync`）は削除しました。

新しい CLI を追加するときは `tools/go.mod` を復活させ、`cmd/<name>/` と `internal/` をここに置きます。

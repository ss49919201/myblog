# Blog CMS

`v3` ディレクトリで `go run .` を実行し、<http://127.0.0.1:8080> を開きます。タイトルと Markdown 本文を入力して保存します。ファイル名はサーバーが UUID から生成します。左側の記事一覧から保存済みの記事を開いて編集できます。

データは `blog.db` の `posts(filename, title, markdown)` テーブルに保存します。Go 1.27 と C コンパイラが必要です。

HTTP ルーティングと画面処理は `server` パッケージ、DB 操作は `post` パッケージにあります。DB 操作には `database/sql` と SQLite ドライバを使用します。

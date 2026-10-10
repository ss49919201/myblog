package main

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestRun(t *testing.T) {
	root := t.TempDir()
	writeRepoFile(t, root, "src/content.config.ts", "export {}\n")
	writeRepoFile(t, root, "src/content/categories/news.md", "---\nname: お知らせ\n---\n")

	code, stdout, stderr := runCmd(root, "check")
	if code != 0 || stdout != "" || stderr != "" {
		t.Fatalf("clean check code=%d stdout=%q stderr=%q", code, stdout, stderr)
	}

	writeRepoFile(t, root, "src/content/posts/hello.md", "---\ntitle: Hello\nslug: hello\ndate: 2026-10-03T00:00:00Z\ndraft: yes\n---\n")
	code, stdout, stderr = runCmd(root, "check")
	const draftYes = "src/content/posts/hello.md: draft: 真偽値が必要です。\"yes\"（!!str）でした\n"
	if code != 1 || stdout != draftYes || stderr != "" {
		t.Fatalf("draft yes code=%d stdout=%q stderr=%q", code, stdout, stderr)
	}

	code, stdout, stderr = runCmd(root, "new", "-title", "Hello, world", "-slug", "hello-world", "-category", "news", "-date", "2026-10-09T07:09:00+09:00")
	if code != 0 || stdout != "src/content/posts/hello-world.md\n" || stderr != "" {
		t.Fatalf("new code=%d stdout=%q stderr=%q", code, stdout, stderr)
	}
	got := readRepoFile(t, root, "src/content/posts/hello-world.md")
	const scaffold = "---\ntitle: Hello, world\nslug: hello-world\ndate: 2026-10-09T07:09:00+09:00\ncategory: news\ndraft: true\n---\n"
	if got != scaffold {
		t.Fatalf("scaffold\n got %q\nwant %q", got, scaffold)
	}

	code, stdout, stderr = runCmd(root, "new", "-title", "Again", "-slug", "hello-world", "-date", "2026-10-09T07:09:00+09:00")
	const exists = "blog new: src/content/posts/hello-world.md は既にあります\n"
	if code != 1 || stdout != "" || stderr != exists {
		t.Fatalf("second new code=%d stdout=%q stderr=%q", code, stdout, stderr)
	}
	if readRepoFile(t, root, "src/content/posts/hello-world.md") != scaffold {
		t.Fatal("second new changed the file")
	}

	code, stdout, stderr = runCmd(root, "new", "-title", "公開", "-slug", "日記", "-date", "2026-10-09T07:09:00+09:00")
	if code != 0 || stdout != "src/content/posts/日記.md\n" || stderr != "" {
		t.Fatalf("japanese code=%d stdout=%q stderr=%q", code, stdout, stderr)
	}

	code, stdout, stderr = runCmd(root, "new", "-title", "Hi", "-slug", "Bad/")
	const badSlug = "\"Bad/\" はスラッグではありません。空文字、.、..、/、\\、NUL は使えません\n"
	if code != 2 || stderr != badSlug {
		t.Fatalf("bad slug code=%d stdout=%q stderr=%q", code, stdout, stderr)
	}

	code, stdout, stderr = runCmd(root, "new", "-title", "Hi", "-slug", "hi", "-date", "2026")
	const badDate = "日付 \"2026\" は解釈できません。2006-01-02、ゾーン無しの 2006-01-02T15:04:05（UTC）、または Z か数値オフセット付きの RFC3339 にしてください\n"
	if code != 2 || stderr != badDate {
		t.Fatalf("bad date code=%d stdout=%q stderr=%q", code, stdout, stderr)
	}

	code, stdout, stderr = runCmd(root, "new", "-title", "Hi", "-slug", "hi", "-category", "tech", "-date", "2026-10-03")
	const missing = "blog new: src/content/posts/hi.md の作成を拒否します:\n  src/content/posts/hi.md: カテゴリ \"tech\" のファイル src/content/categories/tech.md がありません\n"
	if code != 1 || stdout != "" || stderr != missing {
		t.Fatalf("missing category code=%d stdout=%q stderr=%q", code, stdout, stderr)
	}
	if _, err := os.Stat(filepath.Join(root, "src", "content", "posts", "hi.md")); !os.IsNotExist(err) {
		t.Fatal("refused new still wrote hi.md")
	}

	code, stdout, stderr = runCmd(root)
	const usageText = "使い方: blog <command> [flags]\n  new  記事の雛形を src/content/posts/<slug>.md に書きます\n  check  記事の frontmatter を検証します\n  sync  Markdown を HTML に変換して D1 の posts に upsert します\nリポジトリのルートで実行してください。\n"
	if code != 2 || stdout != "" || stderr != usageText {
		t.Fatalf("usage code=%d stdout=%q stderr=%q", code, stdout, stderr)
	}

	mdPath := filepath.Join(root, "post.md")
	const sample = "---\ntitle: Sync\nslug: sync-test\npublished_at: 2026-10-03T00:00:00Z\n---\n\n**hi**\n"
	if err := os.WriteFile(mdPath, []byte(sample), 0o644); err != nil {
		t.Fatal(err)
	}
	code, stdout, stderr = runCmd(root, "sync", "--dry-run", mdPath)
	if code != 0 || stderr != "" {
		t.Fatalf("sync dry-run code=%d stdout=%q stderr=%q", code, stdout, stderr)
	}
	if !strings.Contains(stdout, "--- html ---") || !strings.Contains(stdout, "<strong>hi</strong>") {
		t.Fatalf("sync dry-run stdout=%q", stdout)
	}
}

func runCmd(root string, args ...string) (int, string, string) {
	var stdout, stderr bytes.Buffer
	code := run(root, args, &stdout, &stderr)
	return code, stdout.String(), stderr.String()
}

func writeRepoFile(t *testing.T, root, path, body string) {
	t.Helper()
	full := filepath.Join(root, filepath.FromSlash(path))
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(full, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
}

func readRepoFile(t *testing.T, root, path string) string {
	t.Helper()
	b, err := os.ReadFile(filepath.Join(root, filepath.FromSlash(path)))
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}

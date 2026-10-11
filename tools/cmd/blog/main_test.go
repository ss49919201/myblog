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
	posts := filepath.Join(root, "content", "posts")
	if err := os.MkdirAll(posts, 0o755); err != nil {
		t.Fatal(err)
	}

	code, stdout, stderr := runCmd(root, "check")
	if code != 0 || stdout != "" || stderr != "" {
		t.Fatalf("clean check code=%d stdout=%q stderr=%q", code, stdout, stderr)
	}

	writeRepoFile(t, root, "content/posts/hello.md", "---\ntitle: Hello\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\ndraft: yes\n---\n")
	code, stdout, stderr = runCmd(root, "check")
	const draftYes = "content/posts/hello.md: draft: 真偽値が必要です。\"yes\"（!!str）でした\n"
	if code != 1 || stdout != draftYes || stderr != "" {
		t.Fatalf("draft yes code=%d stdout=%q stderr=%q", code, stdout, stderr)
	}

	code, stdout, stderr = runCmd(root, "new", "-title", "Hello, world", "-slug", "hello-world", "-published-at", "2026-10-09T07:09:00+09:00")
	if code != 0 || stdout != "content/posts/hello-world.md\n" || stderr != "" {
		t.Fatalf("new code=%d stdout=%q stderr=%q", code, stdout, stderr)
	}
	got := readRepoFile(t, root, "content/posts/hello-world.md")
	const scaffold = "---\ntitle: Hello, world\nslug: hello-world\npublished_at: 2026-10-09T07:09:00+09:00\ndraft: true\n---\n"
	if got != scaffold {
		t.Fatalf("scaffold\n got %q\nwant %q", got, scaffold)
	}

	code, stdout, stderr = runCmd(root, "sync", "--dry-run")
	if code != 0 || !strings.HasPrefix(stderr, "成功:") {
		t.Fatalf("sync dry-run code=%d stdout=%q stderr=%q", code, stdout, stderr)
	}
	if !strings.Contains(stdout, "--- html ---") {
		t.Fatalf("sync dry-run stdout=%q", stdout)
	}

	code, stdout, stderr = runCmd(root)
	const usageText = "使い方: blog <command> [flags]\n  new  記事の雛形を content/posts/<slug>.md に書きます\n  check  content/posts の frontmatter を検証します\n  sync  content/posts を HTML に変換して D1 の posts に upsert します\nリポジトリのルートで実行してください。\n"
	if code != 2 || stdout != "" || stderr != usageText {
		t.Fatalf("usage code=%d stdout=%q stderr=%q", code, stdout, stderr)
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

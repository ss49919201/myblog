package main

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestRunCheckAndNew(t *testing.T) {
	root := t.TempDir()
	if err := os.MkdirAll(filepath.Join(root, "src"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "src", "content.config.ts"), []byte("//\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(root, "src", "content", "categories"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "src", "content", "categories", "news.md"), []byte("---\nname: x\n---\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	var out, errOut bytes.Buffer
	if run(root, []string{"check"}, &out, &errOut) != 0 {
		t.Fatalf("check failed: %s", errOut.String())
	}
	if out.Len() != 0 {
		t.Fatalf("stdout %q", out.String())
	}
	out.Reset()
	errOut.Reset()
	if run(root, []string{"new", "-title", "Hi", "-slug", "Bad/"}, &out, &errOut) != exitUsage {
		t.Fatalf("code %d stderr %s", run(root, []string{"new", "-title", "Hi", "-slug", "Bad/"}, &out, &errOut), errOut.String())
	}
	out.Reset()
	errOut.Reset()
	if run(root, []string{"new", "-title", "Hello", "-slug", "hello-world", "-category", "news"}, &out, &errOut) != 0 {
		t.Fatalf("new failed: %s", errOut.String())
	}
	if strings.TrimSpace(out.String()) != "src/content/posts/hello-world.md" {
		t.Fatalf("path %q", out.String())
	}
}

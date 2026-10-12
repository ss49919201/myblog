package webreadonly

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestCheckWebSrc_cleanRepo(t *testing.T) {
	root := findRepoRoot(t)
	hits, err := CheckWebSrc(root)
	if err != nil {
		t.Fatal(err)
	}
	if len(hits) > 0 {
		t.Fatalf("unexpected write SQL:\n%s", strings.Join(hits, "\n"))
	}
}

func TestCheckWebSrc_detectsInsert(t *testing.T) {
	root := t.TempDir()
	src := filepath.Join(root, "apps", "web", "src")
	if err := os.MkdirAll(src, 0o755); err != nil {
		t.Fatal(err)
	}
	path := filepath.Join(src, "bad.ts")
	if err := os.WriteFile(path, []byte("const q = 'INSERT INTO posts'\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	hits, err := CheckWebSrc(root)
	if err != nil {
		t.Fatal(err)
	}
	if len(hits) != 1 {
		t.Fatalf("hits: %v", hits)
	}
}

func findRepoRoot(t *testing.T) string {
	dir, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, "content", "posts")); err == nil {
			if _, err := os.Stat(filepath.Join(dir, "tools", "go.mod")); err == nil {
				return dir
			}
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			t.Fatal("repo root not found")
		}
		dir = parent
	}
}

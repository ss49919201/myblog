package myblog_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/ss49919201/myblog/internal/content"
)

func TestCheckCurrentRepo(t *testing.T) {
	root, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	for {
		if _, err := os.Stat(filepath.Join(root, "src", "content.config.ts")); err == nil {
			break
		}
		parent := filepath.Dir(root)
		if parent == root {
			t.Skip("not in repo")
		}
		root = parent
	}
	probs, err := content.Check(root)
	if err != nil {
		t.Fatal(err)
	}
	if len(probs) != 0 {
		t.Fatal(probs)
	}
}

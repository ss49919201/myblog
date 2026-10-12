package webreadonly

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// D1 SQL in this repo uses uppercase keywords; avoid matching JS .replace() etc.
var writeSQL = regexp.MustCompile(`\b(INSERT|UPDATE|DELETE|REPLACE)\b`)

// CheckWebSrc ensures apps/web/src has no D1 write SQL (test code is out of scope).
func CheckWebSrc(root string) ([]string, error) {
	srcDir := filepath.Join(root, "apps", "web", "src")
	var hits []string
	err := filepath.WalkDir(srcDir, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return err
		}
		if d.IsDir() {
			return nil
		}
		name := d.Name()
		if !strings.HasSuffix(name, ".ts") && !strings.HasSuffix(name, ".tsx") {
			return nil
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(root, path)
		if err != nil {
			rel = path
		}
		lines := strings.Split(string(data), "\n")
		for i, line := range lines {
			if writeSQL.MatchString(line) {
				hits = append(hits, fmt.Sprintf("%s:%d:%s", rel, i+1, strings.TrimSpace(line)))
			}
		}
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("walk apps/web/src: %w", err)
	}
	return hits, nil
}

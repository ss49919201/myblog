package sync

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/cloudflare/cloudflare-go/v3/option"
	"github.com/ss49919201/myblog/tools/internal/d1client"
)

func writePost(t *testing.T, dir, slug string) string {
	t.Helper()
	path := filepath.Join(dir, slug+".md")
	src := "---\ntitle: " + slug + "\nslug: " + slug + "\npublished_at: 2026-10-03T00:00:00Z\n---\n\nbody\n"
	if err := os.WriteFile(path, []byte(src), 0o644); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestSyncPostsContinuesOnParseError(t *testing.T) {
	dir := t.TempDir()
	posts := filepath.Join(dir, "content", "posts")
	if err := os.MkdirAll(posts, 0o755); err != nil {
		t.Fatal(err)
	}
	writePost(t, posts, "ok")
	badPath := filepath.Join(posts, "bad.md")
	if err := os.WriteFile(badPath, []byte("# no frontmatter\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	writePost(t, posts, "ok2")

	var stdout bytes.Buffer
	report := SyncPosts(context.Background(), Publisher{Stdout: &stdout}, Options{
		Root: dir, PostsDir: "content/posts", DryRun: true,
	})

	if report.OK != 2 || report.Failed != 1 {
		t.Fatalf("report ok=%d failed=%d", report.OK, report.Failed)
	}
	if errors.Join(report.Errors...) == nil {
		t.Fatal("expected joined error")
	}
	if !strings.Contains(stdout.String(), "ok.md") || !strings.Contains(stdout.String(), "ok2.md") {
		t.Fatalf("stdout %q", stdout.String())
	}
}

func TestSyncPostsDuplicateSlugBeforeWrite(t *testing.T) {
	dir := t.TempDir()
	posts := filepath.Join(dir, "content", "posts")
	if err := os.MkdirAll(posts, 0o755); err != nil {
		t.Fatal(err)
	}
	writePost(t, posts, "shared")
	first := filepath.Join(posts, "shared.md")
	data, err := os.ReadFile(first)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(posts, "also-shared.md"), data, 0o644); err != nil {
		t.Fatal(err)
	}

	report := SyncPosts(context.Background(), Publisher{Stdout: &bytes.Buffer{}}, Options{
		Root: dir, PostsDir: "content/posts", DryRun: true,
	})
	if report.Failed != 2 || report.OK != 0 {
		t.Fatalf("report ok=%d failed=%d", report.OK, report.Failed)
	}
}

func TestSyncPostsContinuesOnD1Failure(t *testing.T) {
	dir := t.TempDir()
	posts := filepath.Join(dir, "content", "posts")
	if err := os.MkdirAll(posts, 0o755); err != nil {
		t.Fatal(err)
	}
	writePost(t, posts, "slug-a")
	writePost(t, posts, "slug-fail")
	writePost(t, posts, "slug-c")

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var body map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Error(err)
			return
		}
		sql, _ := body["sql"].(string)
		if strings.Contains(sql, "DELETE") {
			w.Header().Set("Content-Type", "application/json")
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"result":  []map[string]interface{}{{"success": true, "results": []interface{}{}}},
			})
			return
		}
		params, _ := body["params"].([]interface{})
		if len(params) > 0 && params[0] == "slug-fail" {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte(`{"success":false,"errors":[{"message":"boom"}]}`))
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"result":  []map[string]interface{}{{"success": true, "results": []interface{}{}}},
		})
	}))
	defer srv.Close()

	client := d1client.New("token", "acct", "db",
		option.WithBaseURL(srv.URL),
		option.WithHTTPClient(srv.Client()),
	)
	var stdout bytes.Buffer
	report := SyncPosts(context.Background(), Publisher{Client: client, Stdout: &stdout}, Options{
		Root: dir, PostsDir: "content/posts",
	})

	if report.OK != 2 || report.Failed != 1 {
		t.Fatalf("report ok=%d failed=%d errors=%v", report.OK, report.Failed, report.Errors)
	}
	if !strings.Contains(stdout.String(), "slug-a") || !strings.Contains(stdout.String(), "slug-c") {
		t.Fatalf("stdout %q", stdout.String())
	}
}

func TestSyncPostsPruneDryRun(t *testing.T) {
	dir := t.TempDir()
	posts := filepath.Join(dir, "content", "posts")
	if err := os.MkdirAll(posts, 0o755); err != nil {
		t.Fatal(err)
	}
	writePost(t, posts, "keep")

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var body map[string]interface{}
		_ = json.NewDecoder(r.Body).Decode(&body)
		sql, _ := body["sql"].(string)
		w.Header().Set("Content-Type", "application/json")
		if strings.Contains(sql, "SELECT slug") {
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"result": []map[string]interface{}{
					{"success": true, "results": []map[string]string{
						{"slug": "keep"},
						{"slug": "gone"},
					}},
				},
			})
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"result":  []map[string]interface{}{{"success": true, "results": []interface{}{}}},
		})
	}))
	defer srv.Close()

	client := d1client.New("token", "acct", "db",
		option.WithBaseURL(srv.URL),
		option.WithHTTPClient(srv.Client()),
	)
	var stdout bytes.Buffer
	report := SyncPosts(context.Background(), Publisher{Client: client, Stdout: &stdout}, Options{
		Root: dir, PostsDir: "content/posts", DryRun: true, Prune: true,
	})
	if report.Failed != 0 || report.OK != 1 {
		t.Fatalf("report ok=%d failed=%d", report.OK, report.Failed)
	}
	if !strings.Contains(stdout.String(), "--- prune ---\ngone") {
		t.Fatalf("stdout %q", stdout.String())
	}
}

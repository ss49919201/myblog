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

func writePost(t *testing.T, dir, name, slug string) string {
	t.Helper()
	path := filepath.Join(dir, name)
	src := "---\ntitle: " + slug + "\nslug: " + slug + "\npublished_at: 2026-10-03T00:00:00Z\n---\n\nbody\n"
	if err := os.WriteFile(path, []byte(src), 0o644); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestPublishFilesContinuesOnParseError(t *testing.T) {
	dir := t.TempDir()
	okPath := writePost(t, dir, "ok.md", "ok")
	badPath := filepath.Join(dir, "bad.md")
	if err := os.WriteFile(badPath, []byte("# no frontmatter\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	ok2Path := writePost(t, dir, "ok2.md", "ok2")

	var stdout bytes.Buffer
	report := PublishFiles(context.Background(), Publisher{Stdout: &stdout}, []string{okPath, badPath, ok2Path}, true)

	if report.OK != 2 || report.Failed != 1 {
		t.Fatalf("report ok=%d failed=%d", report.OK, report.Failed)
	}
	if errors.Join(report.Errors...) == nil {
		t.Fatal("expected joined error")
	}
	if !strings.Contains(report.Errors[0].Error(), badPath) {
		t.Fatalf("error %v", report.Errors[0])
	}
	if !strings.Contains(stdout.String(), okPath) || !strings.Contains(stdout.String(), ok2Path) {
		t.Fatalf("stdout missing successes: %q", stdout.String())
	}
	if strings.Contains(stdout.String(), badPath) {
		t.Fatalf("stdout should not include failed dry-run output: %q", stdout.String())
	}
}

func TestPublishFilesContinuesOnD1Failure(t *testing.T) {
	dir := t.TempDir()
	first := writePost(t, dir, "a.md", "slug-a")
	fail := writePost(t, dir, "b.md", "slug-fail")
	third := writePost(t, dir, "c.md", "slug-c")

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var body map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			t.Error(err)
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
			"result": []map[string]interface{}{
				{"success": true, "results": []interface{}{}},
			},
		})
	}))
	defer srv.Close()

	client := d1client.New("token", "acct", "db",
		option.WithBaseURL(srv.URL),
		option.WithHTTPClient(srv.Client()),
	)
	var stdout bytes.Buffer
	report := PublishFiles(context.Background(), Publisher{Client: client, Stdout: &stdout}, []string{first, fail, third}, false)

	if report.OK != 2 || report.Failed != 1 {
		t.Fatalf("report ok=%d failed=%d errors=%v", report.OK, report.Failed, report.Errors)
	}
	if !strings.Contains(stdout.String(), "slug-a") || !strings.Contains(stdout.String(), "slug-c") {
		t.Fatalf("stdout %q", stdout.String())
	}
	if !strings.Contains(report.Errors[0].Error(), fail) {
		t.Fatalf("error %v", report.Errors[0])
	}
}

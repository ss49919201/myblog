package main

import (
	"context"
	"database/sql"
	"errors"
	"html"
	"net/http"
	"net/http/httptest"
	"net/url"
	"path/filepath"
	"strings"
	"testing"
	"uuid"

	"myblog/v3/post"
	"myblog/v3/server"
)

func TestEditorSavesAndLoads(t *testing.T) {
	ctx := context.Background()
	db := filepath.Join(t.TempDir(), "blog.db")
	store, err := post.NewSQLiteStore(ctx, db)
	if err != nil {
		t.Fatal(err)
	}
	defer store.Close()
	handler := server.NewServer(store).Handler
	empty := httptest.NewRecorder()
	handler.ServeHTTP(empty, httptest.NewRequest(http.MethodGet, "/", nil))
	if empty.Code != http.StatusOK || !strings.Contains(empty.Body.String(), "<textarea") {
		t.Fatalf("empty editor status %d: %s", empty.Code, empty.Body.String())
	}

	filename := ""
	for i, body := range []string{"# First\nIt's here.\n", "# Updated\n"} {
		title := []string{"First", "Updated"}[i]
		form := url.Values{"filename": {filename}, "title": {title}, "markdown": {body}}
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(form.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		resp := httptest.NewRecorder()
		handler.ServeHTTP(resp, req)
		if resp.Code != http.StatusSeeOther {
			t.Fatalf("save status %d: %s", resp.Code, resp.Body.String())
		}
		location, err := url.Parse(resp.Header().Get("Location"))
		if err != nil {
			t.Fatal(err)
		}
		newFilename := location.Query().Get("filename")
		if _, err := uuid.Parse(strings.TrimSuffix(newFilename, ".md")); err != nil || !strings.HasSuffix(newFilename, ".md") {
			t.Fatalf("filename = %q, error %v", newFilename, err)
		}
		if filename != "" && newFilename != filename {
			t.Fatalf("filename changed: %q to %q", filename, newFilename)
		}
		filename = newFilename
		view := httptest.NewRecorder()
		handler.ServeHTTP(view, httptest.NewRequest(http.MethodGet, resp.Header().Get("Location"), nil))
		page := html.UnescapeString(view.Body.String())
		if view.Code != http.StatusOK || !strings.Contains(page, body) || !strings.Contains(page, `value="`+title+`"`) {
			t.Fatalf("status %d, body %q", view.Code, page)
		}
	}
	if err := store.Update(ctx, post.Post{Filename: filename, Title: "Updated", Markdown: "# Updated\n"}); err != nil {
		t.Fatalf("same-value update: %v", err)
	}
	if err := store.Update(ctx, post.Post{Filename: "missing.md", Title: "Missing", Markdown: "x"}); !errors.Is(err, post.ErrNotFound) {
		t.Fatalf("missing update: %v", err)
	}
	missing := url.Values{"filename": {"missing.md"}, "title": {"Missing"}, "markdown": {"x"}}
	missingReq := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(missing.Encode()))
	missingReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	missingResp := httptest.NewRecorder()
	handler.ServeHTTP(missingResp, missingReq)
	if missingResp.Code != http.StatusNotFound {
		t.Fatalf("missing update status = %d", missingResp.Code)
	}

	posts, err := store.List(ctx)
	if err != nil || len(posts) != 1 || posts[0].Title != "Updated" || posts[0].Markdown != "# Updated\n" {
		t.Fatalf("database = %v, error %v", posts, err)
	}

	form := url.Values{"title": {""}, "markdown": {"x"}}
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp := httptest.NewRecorder()
	handler.ServeHTTP(resp, req)
	if resp.Code != http.StatusBadRequest {
		t.Fatalf("invalid title status = %d", resp.Code)
	}
	req = httptest.NewRequest(http.MethodPost, "/", strings.NewReader(url.Values{"title": {"Evil"}, "markdown": {"x"}}.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Origin", "https://example.com")
	resp = httptest.NewRecorder()
	handler.ServeHTTP(resp, req)
	if resp.Code != http.StatusForbidden {
		t.Fatalf("cross-origin status = %d", resp.Code)
	}
}

func TestExistingDatabaseGetsTitleColumn(t *testing.T) {
	ctx := context.Background()
	db := filepath.Join(t.TempDir(), "blog.db")
	conn, err := sql.Open("sqlite3", db)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := conn.ExecContext(ctx, "CREATE TABLE posts (filename TEXT PRIMARY KEY, markdown TEXT NOT NULL)"); err != nil {
		t.Fatal(err)
	}
	if _, err := conn.ExecContext(ctx, "INSERT INTO posts VALUES ('old.md', '# Old')"); err != nil {
		t.Fatal(err)
	}
	conn.Close()
	for range 2 {
		store, err := post.NewSQLiteStore(ctx, db)
		if err != nil {
			t.Fatal(err)
		}
		store.Close()
	}
	conn, err = sql.Open("sqlite3", db)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close()
	var filename, title, markdown string
	if err := conn.QueryRowContext(ctx, "SELECT filename, title, markdown FROM posts").Scan(&filename, &title, &markdown); err != nil || filename != "old.md" || title != "" || markdown != "# Old" {
		t.Fatalf("migrated row = %q, %q, %q; error %v", filename, title, markdown, err)
	}
}

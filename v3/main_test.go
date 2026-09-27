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

	"github.com/ss49919201/myblog/cms/post"
	"github.com/ss49919201/myblog/cms/server"
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

	id := ""
	for i, body := range []string{"# First\nIt's here.\n", "# Updated\n"} {
		title := []string{"First", "Updated"}[i]
		form := url.Values{"id": {id}, "title": {title}, "markdown": {body}}
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
		newID := location.Query().Get("id")
		if _, err := uuid.Parse(newID); err != nil {
			t.Fatalf("id = %q, error %v", newID, err)
		}
		if id != "" && newID != id {
			t.Fatalf("id changed: %q to %q", id, newID)
		}
		id = newID
		view := httptest.NewRecorder()
		handler.ServeHTTP(view, httptest.NewRequest(http.MethodGet, resp.Header().Get("Location"), nil))
		page := html.UnescapeString(view.Body.String())
		if view.Code != http.StatusOK || !strings.Contains(page, body) || !strings.Contains(page, `value="`+title+`"`) {
			t.Fatalf("status %d, body %q", view.Code, page)
		}
	}
	if err := store.Update(ctx, post.Post{ID: id, Title: "Updated", Markdown: "# Updated\n"}); err != nil {
		t.Fatalf("same-value update: %v", err)
	}
	if err := store.Update(ctx, post.Post{ID: "missing", Title: "Missing", Markdown: "x"}); !errors.Is(err, post.ErrNotFound) {
		t.Fatalf("missing update: %v", err)
	}
	missing := url.Values{"id": {"missing"}, "title": {"Missing"}, "markdown": {"x"}}
	missingReq := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(missing.Encode()))
	missingReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	missingResp := httptest.NewRecorder()
	handler.ServeHTTP(missingResp, missingReq)
	if missingResp.Code != http.StatusNotFound {
		t.Fatalf("missing update status = %d", missingResp.Code)
	}

	posts, err := store.List(ctx)
	if err != nil || len(posts) != 1 || posts[0].ID != id || posts[0].Filename() != id+".md" || posts[0].Title != "Updated" || posts[0].Markdown != "# Updated\n" {
		t.Fatalf("database = %v, error %v", posts, err)
	}
}

func TestExistingDatabaseGetsIDAndTitleColumns(t *testing.T) {
	for _, withTitle := range []bool{false, true} {
		t.Run(map[bool]string{false: "without title", true: "with title"}[withTitle], func(t *testing.T) {
			ctx := context.Background()
			db := filepath.Join(t.TempDir(), "blog.db")
			conn, err := sql.Open("sqlite3", db)
			if err != nil {
				t.Fatal(err)
			}
			if _, err := conn.ExecContext(ctx, "CREATE TABLE posts (filename TEXT PRIMARY KEY, markdown TEXT NOT NULL)"); err != nil {
				t.Fatal(err)
			}
			if withTitle {
				if _, err := conn.ExecContext(ctx, "ALTER TABLE posts ADD COLUMN title TEXT NOT NULL DEFAULT ''"); err != nil {
					t.Fatal(err)
				}
			}
			if _, err := conn.ExecContext(ctx, "INSERT INTO posts (filename, markdown) VALUES ('old.md', '# Old')"); err != nil {
				t.Fatal(err)
			}
			if withTitle {
				if _, err := conn.ExecContext(ctx, "UPDATE posts SET title='Legacy'"); err != nil {
					t.Fatal(err)
				}
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
			var id, title, markdown string
			wantTitle := ""
			if withTitle {
				wantTitle = "Legacy"
			}
			if err := conn.QueryRowContext(ctx, "SELECT id, title, markdown FROM posts").Scan(&id, &title, &markdown); err != nil || id != "old" || title != wantTitle || markdown != "# Old" {
				t.Fatalf("migrated row = %q, %q, %q; error %v", id, title, markdown, err)
			}
		})
	}
}

package d1client

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/cloudflare/cloudflare-go/v3/option"
)

func TestUpsertPost(t *testing.T) {
	var gotBody map[string]interface{}
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			t.Fatalf("method %s", r.Method)
		}
		wantPath := "/accounts/acct-1/d1/database/db-1/query"
		if r.URL.Path != wantPath {
			t.Fatalf("path %s want %s", r.URL.Path, wantPath)
		}
		if err := json.NewDecoder(r.Body).Decode(&gotBody); err != nil {
			t.Fatal(err)
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

	client := New("token", "acct-1", "db-1",
		option.WithBaseURL(srv.URL),
		option.WithHTTPClient(srv.Client()),
	)
	row := PostRow{
		Slug:        "hello",
		Title:       "Hello",
		PublishedAt: "2026-10-03T00:00:00Z",
		BodyHTML:    "<p>hi</p>",
	}
	if err := client.UpsertPost(context.Background(), row); err != nil {
		t.Fatal(err)
	}
	if gotBody["sql"] != UpsertSQL {
		t.Fatalf("sql %v", gotBody["sql"])
	}
	params, ok := gotBody["params"].([]interface{})
	if !ok || len(params) != 4 {
		t.Fatalf("params %v", gotBody["params"])
	}
	for i, want := range UpsertParams(row) {
		if params[i] != want {
			t.Fatalf("param %d %v want %q", i, params[i], want)
		}
	}
}

func TestUpsertPostAPIError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		_, _ = io.WriteString(w, `{"success":false,"errors":[{"message":"bad token"}]}`)
	}))
	defer srv.Close()

	client := New("token", "acct-1", "db-1",
		option.WithBaseURL(srv.URL),
		option.WithHTTPClient(srv.Client()),
	)
	err := client.UpsertPost(context.Background(), PostRow{
		Slug: "x", Title: "t", PublishedAt: "2026-10-03T00:00:00Z", BodyHTML: "<p>x</p>",
	})
	if err == nil {
		t.Fatal("expected error")
	}
}

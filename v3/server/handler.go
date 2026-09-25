package server

import (
	_ "embed"
	"errors"
	"html/template"
	"log/slog"
	"net/http"
	"net/url"
	"time"
	"uuid"

	"myblog/v3/post"
)

//go:embed editor.tmpl
var pageText string

var page = template.Must(template.New("editor").Parse(pageText))

func NewServer(store *post.Store) *http.Server {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /", getPage(store))
	mux.HandleFunc("POST /", createPost(store))
	return &http.Server{Addr: "127.0.0.1:8080", Handler: mux, ReadHeaderTimeout: 5 * time.Second}
}

func getPage(store *post.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		posts, err := store.List(r.Context())
		if err != nil {
			slog.ErrorContext(r.Context(), "list posts", "error", err)
			http.Error(w, "記事を読み込めません", http.StatusInternalServerError)
			return
		}
		var current post.Post
		for _, p := range posts {
			if p.Filename == r.URL.Query().Get("filename") {
				current = p
				break
			}
		}
		if err := page.Execute(w, struct {
			Posts   []post.Post
			Current post.Post
			Saved   bool
		}{posts, current, r.URL.Query().Get("saved") == "1"}); err != nil {
			slog.ErrorContext(r.Context(), "render editor", "error", err)
		}
	}
}

func createPost(store *post.Store) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		name, title, body := r.PostFormValue("filename"), r.PostFormValue("title"), r.PostFormValue("markdown")
		editing := name != ""
		if !editing {
			name = uuid.New().String() + ".md"
		}
		p := post.Post{Filename: name, Title: title, Markdown: body}
		var err error
		if editing {
			err = store.Update(r.Context(), p)
		} else {
			err = store.Create(r.Context(), p)
		}
		if errors.Is(err, post.ErrNotFound) {
			http.Error(w, "記事が見つかりません", http.StatusNotFound)
			return
		}
		if err != nil {
			slog.ErrorContext(r.Context(), "save post", "error", err)
			http.Error(w, "保存できません", http.StatusInternalServerError)
			return
		}
		http.Redirect(w, r, "/?filename="+url.QueryEscape(name)+"&saved=1", http.StatusSeeOther)
	}
}

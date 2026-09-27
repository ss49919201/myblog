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

	"github.com/samber/lo"

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
		current, _ := lo.Find(posts, func(p post.Post) bool { return p.ID == r.URL.Query().Get("id") })
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
		id, title, body := r.PostFormValue("id"), r.PostFormValue("title"), r.PostFormValue("markdown")
		editing := id != ""
		if !editing {
			id = uuid.New().String()
		}
		p := post.Post{ID: id, Title: title, Markdown: body}
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
		http.Redirect(w, r, "/?id="+url.QueryEscape(id)+"&saved=1", http.StatusSeeOther)
	}
}

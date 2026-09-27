package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/ss49919201/myblog/cms/post"
	"github.com/ss49919201/myblog/cms/server"
)

func main() {
	if err := run(); err != nil {
		slog.Error("application stopped", "error", err)
		os.Exit(1)
	}
}

func run() error {
	store, err := post.NewSQLiteStore(context.Background(), "blog.db")
	if err != nil {
		return err
	}
	defer store.Close()
	return server.Serve(store)
}

package main

import (
	"log/slog"
	"os"

	"github.com/ss49919201/myblog/api/internal/server"
)

func init() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
}

func main() {
	server := server.NewServer()

	slog.Info("starting server", slog.String("address", server.Addr))

	if err := server.ListenAndServe(); err != nil {
		slog.Error("failed to listen and serve", slog.Any("error", err))
		os.Exit(1)
	}
}

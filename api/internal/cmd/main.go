package main

import (
	"log/slog"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/ss49919201/myblog/api/internal/openapi"
	"github.com/ss49919201/myblog/api/internal/server"
)

func init() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
}

func main() {
	r := gin.Default()
	s := server.NewServer()
	
	openapi.RegisterHandlers(r, s)
	
	if err := r.Run(":8080"); err != nil {
		slog.Error("Failed to start server", "error", err)
		os.Exit(1)
	}
}

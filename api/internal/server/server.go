package server

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ss49919201/myblog/api/internal/post/di"
	"github.com/ss49919201/myblog/api/internal/post/usecase"
)

type Server struct {
	container *di.Container
}

func NewServer() *Server {
	return &Server{
		container: di.NewContainer(),
	}
}

func (s *Server) PostsRead(c *gin.Context, id string) {
	db, err := s.container.DB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database connection failed"})
		return
	}

	input := usecase.GetPostInput{ID: id}
	output, err := usecase.GetPost(c.Request.Context(), db, input)
	if err != nil {
		var usecaseErr *usecase.Error
		if errors.As(err, &usecaseErr) {
			switch usecaseErr.Kind {
			case usecase.ErrInvalidParameter:
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
				return
			case usecase.ErrResourceNotFound:
				c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
				return
			}
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, output.Post)
}

func (s *Server) PostsList(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

func (s *Server) PostsCreate(c *gin.Context) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

func (s *Server) PostsDelete(c *gin.Context, id string) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

func (s *Server) PostsUpdate(c *gin.Context, id string) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}

func (s *Server) PostsAnalyze(c *gin.Context, id string) {
	c.JSON(http.StatusNotImplemented, gin.H{"error": "not implemented"})
}
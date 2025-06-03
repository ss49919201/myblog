package server

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ss49919201/myblog/api/internal/post/di"
	"github.com/ss49919201/myblog/api/internal/post/entity/post"
	"github.com/ss49919201/myblog/api/internal/post/rdb"
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

	postID, err := post.ParsePostID(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	foundPost, err := rdb.FindPostByID(c.Request.Context(), db, postID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) || err.Error() == "post not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	c.JSON(http.StatusOK, foundPost)
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
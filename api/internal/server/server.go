package server

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ss49919201/myblog/api/internal/post/di"
	"github.com/ss49919201/myblog/api/internal/post/entity/post"
	"github.com/ss49919201/myblog/api/internal/post/rdb"
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
	repo, err := s.container.PostRepository()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get repository"})
		return
	}

	postID, err := post.ParsePostID(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	foundPost, err := repo.FindByID(c, postID)
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
	db, err := s.container.DB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "database connection failed"})
		return
	}

	posts, err := rdb.FindAllPosts(c.Request.Context(), db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	response := gin.H{
		"items": posts,
	}

	c.JSON(http.StatusOK, response)
}

func (s *Server) PostsCreate(c *gin.Context) {
	uc, err := s.container.CreatePostUsecase()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get usecase"})
		return
	}

	var input struct {
		Title string `json:"title"`
		Body  string `json:"body"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	output, err := uc.Execute(c.Request.Context(), usecase.CreatePostInput{
		Title: input.Title,
		Body:  input.Body,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create post"})
		return
	}

	c.JSON(http.StatusOK, output.Post)
}

func (s *Server) PostsDelete(c *gin.Context, id string) {
	uc, err := s.container.DeletePostUsecase()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get usecase"})
		return
	}

	err = uc.Execute(c.Request.Context(), usecase.DeletePostInput{
		ID: id,
	})
	if err != nil {
		if err.Error() == "post not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete post"})
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

func (s *Server) PostsUpdate(c *gin.Context, id string) {
	uc, err := s.container.UpdatePostUsecase()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get usecase"})
		return
	}

	var input struct {
		Title string `json:"title"`
		Body  string `json:"body"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	output, err := uc.Execute(c.Request.Context(), usecase.UpdatePostInput{
		ID:    id,
		Title: input.Title,
		Body:  input.Body,
	})
	if err != nil {
		if err.Error() == "post not found" {
			c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update post"})
		return
	}

	c.JSON(http.StatusOK, output.Post)
}

func (s *Server) PostsAnalyze(c *gin.Context, id string) {
	uc, err := s.container.AnalyzePostUsecase()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get usecase"})
		return
	}

	output, err := uc.Execute(c.Request.Context(), usecase.AnalyzePostInput{
		ID: id,
	})
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid post id"})
		return
	}

	c.JSON(http.StatusOK, output)
}

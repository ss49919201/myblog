package server

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ss49919201/myblog/api/internal/openapi"
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

func (s *Server) PostsCreate(c *gin.Context, params openapi.PostsCreateParams) {
	uc, err := s.container.CreatePostUsecase()
	if err != nil {
		c.JSON(http.StatusInternalServerError, openapi.Error{
			Code:    http.StatusInternalServerError,
			Message: "failed to get usecase",
		})
		return
	}

	var request openapi.CreatePostRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, openapi.Error{
			Code:    http.StatusBadRequest,
			Message: "invalid request body",
		})
		return
	}

	// OpenAPI型からUsecase型への変換
	var tags []string
	if request.Tags != nil {
		tags = request.Tags
	}

	input := usecase.CreatePostInput{
		Title:                request.Title,
		Body:                 request.Body,
		Status:               usecase.PublicationStatus(request.Status),
		ScheduledAt:          request.ScheduledAt,
		Category:             request.Category,
		Tags:                 tags,
		FeaturedImageURL:     request.FeaturedImageURL,
		MetaDescription:      request.MetaDescription,
		Slug:                 request.Slug,
		SNSAutoPost:          request.SnsAutoPost,
		ExternalNotification: request.ExternalNotification,
		EmergencyFlag:        request.EmergencyFlag,
	}

	userCtx := usecase.UserContext{
		Role: usecase.UserRole(params.XUserRole),
	}

	output, err := uc.Execute(c.Request.Context(), input, userCtx)
	if err != nil {
		// バリデーションエラーの場合
		if validationErr, ok := post.AsErrValidation(err); ok {
			c.JSON(http.StatusBadRequest, openapi.ValidationErrors{
				Code:    http.StatusBadRequest,
				Message: "Validation failed",
				Errors: []openapi.ValidationError{
					{
						Code:    http.StatusBadRequest,
						Field:   validationErr.Field,
						Message: validationErr.Message,
					},
				},
			})
			return
		}

		c.JSON(http.StatusInternalServerError, openapi.Error{
			Code:    http.StatusInternalServerError,
			Message: "failed to create post",
		})
		return
	}

	// Post エンティティからOpenAPI型への変換
	response := openapi.Post{
		Id:                   output.Post.ID.String(),
		Title:                output.Post.Title,
		Body:                 output.Post.Body,
		Status:               openapi.PublicationStatus(output.Post.Status),
		ScheduledAt:          output.Post.ScheduledAt,
		Category:             output.Post.Category,
		Tags:                 output.Post.Tags,
		FeaturedImageURL:     output.Post.FeaturedImageURL,
		MetaDescription:      output.Post.MetaDescription,
		Slug:                 output.Post.Slug,
		SnsAutoPost:          output.Post.SNSAutoPost,
		ExternalNotification: output.Post.ExternalNotification,
		EmergencyFlag:        output.Post.EmergencyFlag,
		CreatedAt:            output.Post.CreatedAt,
		PublishedAt:          output.Post.PublishedAt,
	}

	c.JSON(http.StatusOK, response)
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

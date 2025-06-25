package middleware

import (
	"errors"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ss49919201/myblog/api/internal/post/entity/post"
)

// ErrorHandler processes errors registered with c.Error() and panic recovery
func ErrorHandler() gin.HandlerFunc {
	return gin.HandlerFunc(func(c *gin.Context) {
		// Continue processing the request
		c.Next()

		// Check if there are any errors
		if len(c.Errors) > 0 {
			err := c.Errors.Last().Err
			handleError(c, err)
		}
	})
}

// Recovery middleware for panic handling
func Recovery() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered any) {
		var err error

		switch v := recovered.(type) {
		case error:
			err = v
		case string:
			err = errors.New(v)
		default:
			err = errors.New("unknown error")
		}

		handleError(c, err)
	})
}

func handleError(c *gin.Context, err error) {
	// Check for validation errors
	if post.IsErrValidation(err) {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		c.Abort()
		slog.Warn("validation error", slog.String("err", err.Error()))
		return
	}

	if _, ok := post.AsErrPostNotFound(err); ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "post not found"})
		c.Abort()
		slog.Warn("validation error", slog.String("err", err.Error()))
		return
	}

	// Default to internal server error for unhandled errors
	c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
	c.Abort()
	slog.Error("internal error", slog.String("err", err.Error()))
}

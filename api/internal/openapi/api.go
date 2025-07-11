// Package openapi provides primitives to interact with the openapi HTTP API.
//
// Code generated by github.com/oapi-codegen/oapi-codegen/v2 version v2.4.1 DO NOT EDIT.
package openapi

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/oapi-codegen/runtime"
)

// Defines values for PublicationStatus.
const (
	Draft     PublicationStatus = "draft"
	Published PublicationStatus = "published"
	Scheduled PublicationStatus = "scheduled"
)

// Defines values for UserRole.
const (
	Admin   UserRole = "admin"
	Editor  UserRole = "editor"
	General UserRole = "general"
)

// AnalyzeResult defines model for AnalyzeResult.
type AnalyzeResult struct {
	Analysis string `json:"analysis"`
	Id       string `json:"id"`
}

// CreatePostRequest defines model for CreatePostRequest.
type CreatePostRequest struct {
	Body                 string            `json:"body"`
	Category             string            `json:"category"`
	EmergencyFlag        bool              `json:"emergencyFlag"`
	ExternalNotification bool              `json:"externalNotification"`
	FeaturedImageURL     *string           `json:"featuredImageURL"`
	MetaDescription      *string           `json:"metaDescription"`
	ScheduledAt          *time.Time        `json:"scheduledAt"`
	Slug                 *string           `json:"slug"`
	SnsAutoPost          bool              `json:"snsAutoPost"`
	Status               PublicationStatus `json:"status"`
	Tags                 []string          `json:"tags"`
	Title                string            `json:"title"`
}

// Error defines model for Error.
type Error struct {
	Code    int32  `json:"code"`
	Message string `json:"message"`
}

// Post defines model for Post.
type Post struct {
	Body                 string            `json:"body"`
	Category             string            `json:"category"`
	CreatedAt            time.Time         `json:"createdAt"`
	EmergencyFlag        bool              `json:"emergencyFlag"`
	ExternalNotification bool              `json:"externalNotification"`
	FeaturedImageURL     *string           `json:"featuredImageURL"`
	Id                   string            `json:"id"`
	MetaDescription      *string           `json:"metaDescription"`
	PublishedAt          *time.Time        `json:"publishedAt"`
	ScheduledAt          *time.Time        `json:"scheduledAt"`
	Slug                 *string           `json:"slug"`
	SnsAutoPost          bool              `json:"snsAutoPost"`
	Status               PublicationStatus `json:"status"`
	Tags                 []string          `json:"tags"`
	Title                string            `json:"title"`
}

// PostList defines model for PostList.
type PostList struct {
	Items []Post `json:"items"`
}

// PostMergePatchUpdate defines model for PostMergePatchUpdate.
type PostMergePatchUpdate struct {
	Body                 *string            `json:"body,omitempty"`
	Category             *string            `json:"category,omitempty"`
	CreatedAt            *time.Time         `json:"createdAt,omitempty"`
	EmergencyFlag        *bool              `json:"emergencyFlag,omitempty"`
	ExternalNotification *bool              `json:"externalNotification,omitempty"`
	FeaturedImageURL     *string            `json:"featuredImageURL"`
	Id                   *string            `json:"id,omitempty"`
	MetaDescription      *string            `json:"metaDescription"`
	PublishedAt          *time.Time         `json:"publishedAt"`
	ScheduledAt          *time.Time         `json:"scheduledAt"`
	Slug                 *string            `json:"slug"`
	SnsAutoPost          *bool              `json:"snsAutoPost,omitempty"`
	Status               *PublicationStatus `json:"status,omitempty"`
	Tags                 *[]string          `json:"tags,omitempty"`
	Title                *string            `json:"title,omitempty"`
}

// PublicationStatus defines model for PublicationStatus.
type PublicationStatus string

// UserRole defines model for UserRole.
type UserRole string

// ValidationError defines model for ValidationError.
type ValidationError struct {
	Code    int32  `json:"code"`
	Field   string `json:"field"`
	Message string `json:"message"`
}

// ValidationErrors defines model for ValidationErrors.
type ValidationErrors struct {
	Code    int32             `json:"code"`
	Errors  []ValidationError `json:"errors"`
	Message string            `json:"message"`
}

// PostsCreateParams defines parameters for PostsCreate.
type PostsCreateParams struct {
	XUserRole UserRole `json:"X-User-Role"`
}

// PostsCreateJSONRequestBody defines body for PostsCreate for application/json ContentType.
type PostsCreateJSONRequestBody = CreatePostRequest

// PostsUpdateApplicationMergePatchPlusJSONRequestBody defines body for PostsUpdate for application/merge-patch+json ContentType.
type PostsUpdateApplicationMergePatchPlusJSONRequestBody = PostMergePatchUpdate

// ServerInterface represents all server handlers.
type ServerInterface interface {

	// (GET /api/posts)
	PostsList(c *gin.Context)

	// (POST /api/posts)
	PostsCreate(c *gin.Context, params PostsCreateParams)

	// (DELETE /api/posts/{id})
	PostsDelete(c *gin.Context, id string)

	// (GET /api/posts/{id})
	PostsRead(c *gin.Context, id string)

	// (PATCH /api/posts/{id})
	PostsUpdate(c *gin.Context, id string)

	// (POST /api/posts/{id}/analyze)
	PostsAnalyze(c *gin.Context, id string)
}

// ServerInterfaceWrapper converts contexts to parameters.
type ServerInterfaceWrapper struct {
	Handler            ServerInterface
	HandlerMiddlewares []MiddlewareFunc
	ErrorHandler       func(*gin.Context, error, int)
}

type MiddlewareFunc func(c *gin.Context)

// PostsList operation middleware
func (siw *ServerInterfaceWrapper) PostsList(c *gin.Context) {

	for _, middleware := range siw.HandlerMiddlewares {
		middleware(c)
		if c.IsAborted() {
			return
		}
	}

	siw.Handler.PostsList(c)
}

// PostsCreate operation middleware
func (siw *ServerInterfaceWrapper) PostsCreate(c *gin.Context) {

	var err error

	// Parameter object where we will unmarshal all parameters from the context
	var params PostsCreateParams

	headers := c.Request.Header

	// ------------- Required header parameter "X-User-Role" -------------
	if valueList, found := headers[http.CanonicalHeaderKey("X-User-Role")]; found {
		var XUserRole UserRole
		n := len(valueList)
		if n != 1 {
			siw.ErrorHandler(c, fmt.Errorf("Expected one value for X-User-Role, got %d", n), http.StatusBadRequest)
			return
		}

		err = runtime.BindStyledParameterWithOptions("simple", "X-User-Role", valueList[0], &XUserRole, runtime.BindStyledParameterOptions{ParamLocation: runtime.ParamLocationHeader, Explode: false, Required: true})
		if err != nil {
			siw.ErrorHandler(c, fmt.Errorf("Invalid format for parameter X-User-Role: %w", err), http.StatusBadRequest)
			return
		}

		params.XUserRole = XUserRole

	} else {
		siw.ErrorHandler(c, fmt.Errorf("Header parameter X-User-Role is required, but not found"), http.StatusBadRequest)
		return
	}

	for _, middleware := range siw.HandlerMiddlewares {
		middleware(c)
		if c.IsAborted() {
			return
		}
	}

	siw.Handler.PostsCreate(c, params)
}

// PostsDelete operation middleware
func (siw *ServerInterfaceWrapper) PostsDelete(c *gin.Context) {

	var err error

	// ------------- Path parameter "id" -------------
	var id string

	err = runtime.BindStyledParameterWithOptions("simple", "id", c.Param("id"), &id, runtime.BindStyledParameterOptions{Explode: false, Required: true})
	if err != nil {
		siw.ErrorHandler(c, fmt.Errorf("Invalid format for parameter id: %w", err), http.StatusBadRequest)
		return
	}

	for _, middleware := range siw.HandlerMiddlewares {
		middleware(c)
		if c.IsAborted() {
			return
		}
	}

	siw.Handler.PostsDelete(c, id)
}

// PostsRead operation middleware
func (siw *ServerInterfaceWrapper) PostsRead(c *gin.Context) {

	var err error

	// ------------- Path parameter "id" -------------
	var id string

	err = runtime.BindStyledParameterWithOptions("simple", "id", c.Param("id"), &id, runtime.BindStyledParameterOptions{Explode: false, Required: true})
	if err != nil {
		siw.ErrorHandler(c, fmt.Errorf("Invalid format for parameter id: %w", err), http.StatusBadRequest)
		return
	}

	for _, middleware := range siw.HandlerMiddlewares {
		middleware(c)
		if c.IsAborted() {
			return
		}
	}

	siw.Handler.PostsRead(c, id)
}

// PostsUpdate operation middleware
func (siw *ServerInterfaceWrapper) PostsUpdate(c *gin.Context) {

	var err error

	// ------------- Path parameter "id" -------------
	var id string

	err = runtime.BindStyledParameterWithOptions("simple", "id", c.Param("id"), &id, runtime.BindStyledParameterOptions{Explode: false, Required: true})
	if err != nil {
		siw.ErrorHandler(c, fmt.Errorf("Invalid format for parameter id: %w", err), http.StatusBadRequest)
		return
	}

	for _, middleware := range siw.HandlerMiddlewares {
		middleware(c)
		if c.IsAborted() {
			return
		}
	}

	siw.Handler.PostsUpdate(c, id)
}

// PostsAnalyze operation middleware
func (siw *ServerInterfaceWrapper) PostsAnalyze(c *gin.Context) {

	var err error

	// ------------- Path parameter "id" -------------
	var id string

	err = runtime.BindStyledParameterWithOptions("simple", "id", c.Param("id"), &id, runtime.BindStyledParameterOptions{Explode: false, Required: true})
	if err != nil {
		siw.ErrorHandler(c, fmt.Errorf("Invalid format for parameter id: %w", err), http.StatusBadRequest)
		return
	}

	for _, middleware := range siw.HandlerMiddlewares {
		middleware(c)
		if c.IsAborted() {
			return
		}
	}

	siw.Handler.PostsAnalyze(c, id)
}

// GinServerOptions provides options for the Gin server.
type GinServerOptions struct {
	BaseURL      string
	Middlewares  []MiddlewareFunc
	ErrorHandler func(*gin.Context, error, int)
}

// RegisterHandlers creates http.Handler with routing matching OpenAPI spec.
func RegisterHandlers(router gin.IRouter, si ServerInterface) {
	RegisterHandlersWithOptions(router, si, GinServerOptions{})
}

// RegisterHandlersWithOptions creates http.Handler with additional options
func RegisterHandlersWithOptions(router gin.IRouter, si ServerInterface, options GinServerOptions) {
	errorHandler := options.ErrorHandler
	if errorHandler == nil {
		errorHandler = func(c *gin.Context, err error, statusCode int) {
			c.JSON(statusCode, gin.H{"msg": err.Error()})
		}
	}

	wrapper := ServerInterfaceWrapper{
		Handler:            si,
		HandlerMiddlewares: options.Middlewares,
		ErrorHandler:       errorHandler,
	}

	router.GET(options.BaseURL+"/api/posts", wrapper.PostsList)
	router.POST(options.BaseURL+"/api/posts", wrapper.PostsCreate)
	router.DELETE(options.BaseURL+"/api/posts/:id", wrapper.PostsDelete)
	router.GET(options.BaseURL+"/api/posts/:id", wrapper.PostsRead)
	router.PATCH(options.BaseURL+"/api/posts/:id", wrapper.PostsUpdate)
	router.POST(options.BaseURL+"/api/posts/:id/analyze", wrapper.PostsAnalyze)
}

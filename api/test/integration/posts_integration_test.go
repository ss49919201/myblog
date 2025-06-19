package integration_test

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/ss49919201/myblog/api/internal/openapi"
	"github.com/ss49919201/myblog/api/internal/server"
)

const testPostID = "01234567-89ab-cdef-0123-456789abcdef"

func TestPostsRead_Success(t *testing.T) {
	db := setupDatabase(t)
	defer db.Close()

	loadTestData(t)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	serverInstance := server.NewServer()
	openapi.RegisterHandlers(router, serverInstance)

	req := httptest.NewRequest(http.MethodGet, fmt.Sprintf("/api/posts/%s", testPostID), nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	body := w.Body.String()
	assert.Contains(t, body, testPostID)
	assert.Contains(t, body, "Test Post Title")
	assert.Contains(t, body, "This is a test post body content for integration testing.")
	assert.Contains(t, body, "2024-01-01T10:00:00Z")
}

func TestPostsList_Success(t *testing.T) {
	db := setupDatabase(t)
	defer db.Close()

	loadTestData(t)

	gin.SetMode(gin.TestMode)
	router := gin.New()
	serverInstance := server.NewServer()
	openapi.RegisterHandlers(router, serverInstance)

	req := httptest.NewRequest(http.MethodGet, "/api/posts", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	body := w.Body.String()
	assert.Contains(t, body, "items")
	assert.Contains(t, body, testPostID)
	assert.Contains(t, body, "Test Post Title")
}

func setupDatabase(t *testing.T) *sql.DB {
	t.Helper()

	dsn := "user:password@tcp(localhost:3306)/rdb?parseTime=true"
	db, err := sql.Open("mysql", dsn)
	require.NoError(t, err, "Failed to open database connection")

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	for {
		select {
		case <-ctx.Done():
			t.Fatal("Database connection timeout")
		default:
			if err := db.Ping(); err == nil {
				return db
			}
			time.Sleep(1 * time.Second)
		}
	}
}

func loadTestData(t *testing.T) {
	t.Helper()

	testDataPath := filepath.Join("..", "..", "testdata", "posts.sql")
	sqlBytes, err := os.ReadFile(testDataPath)
	require.NoError(t, err, "Failed to read test data file")

	dsn := "user:password@tcp(localhost:3306)/rdb?parseTime=true&multiStatements=true"
	db, err := sql.Open("mysql", dsn)
	require.NoError(t, err, "Failed to open database connection for test data")
	defer db.Close()

	_, err = db.Exec(string(sqlBytes))
	require.NoError(t, err, "Failed to execute test data SQL")
}

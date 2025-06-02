package usecase_test

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	_ "github.com/go-sql-driver/mysql"
	"github.com/ss49919201/myblog/api/internal/post/entity/post"
	"github.com/ss49919201/myblog/api/internal/post/rdb"
	"github.com/ss49919201/myblog/api/internal/post/usecase"
)

func setupTestDB(t *testing.T) *sql.DB {
	dsn := "user:password@tcp(localhost:3306)/rdb?parseTime=true"
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}

	if err := db.Ping(); err != nil {
		t.Skipf("Database not available: %v", err)
	}

	// Clean up any existing test data
	_, err = db.Exec("DELETE FROM posts WHERE title LIKE 'Test%'")
	if err != nil {
		t.Fatalf("Failed to clean up test data: %v", err)
	}

	return db
}

func TestGetPost_Success(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	ctx := context.Background()

	// Create and save a test post
	testPost, err := post.Construct("Test Get Title", "Test Get Body Content")
	if err != nil {
		t.Fatalf("Failed to construct test post: %v", err)
	}

	err = rdb.SavePost(ctx, db, testPost)
	if err != nil {
		t.Fatalf("Failed to save test post: %v", err)
	}

	// Test the GetPost usecase
	input := usecase.GetPostInput{ID: string(testPost.ID)}
	output, err := usecase.GetPost(ctx, db, input)
	if err != nil {
		t.Fatalf("GetPost failed: %v", err)
	}

	// Verify the output
	if output.Post.ID != testPost.ID {
		t.Errorf("Expected ID %v, got %v", testPost.ID, output.Post.ID)
	}
	if output.Post.Title != testPost.Title {
		t.Errorf("Expected title %v, got %v", testPost.Title, output.Post.Title)
	}
	if output.Post.Body != testPost.Body {
		t.Errorf("Expected body %v, got %v", testPost.Body, output.Post.Body)
	}
}

func TestGetPost_InvalidID(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	ctx := context.Background()

	// Test with invalid ID
	input := usecase.GetPostInput{ID: "invalid-id"}
	_, err := usecase.GetPost(ctx, db, input)
	if err == nil {
		t.Fatal("Expected error for invalid ID, got nil")
	}

	// Check that it's an invalid parameter error
	var usecaseErr *usecase.Error
	if !errors.As(err, &usecaseErr) || usecaseErr.Kind != usecase.ErrInvalidParameter {
		t.Errorf("Expected ErrInvalidParameter, got %v", err)
	}
}

func TestGetPost_NotFound(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	ctx := context.Background()

	// Test with valid but non-existent ID
	nonExistentID := post.NewPostID()
	input := usecase.GetPostInput{ID: string(nonExistentID)}
	_, err := usecase.GetPost(ctx, db, input)
	if err == nil {
		t.Fatal("Expected error for non-existent post, got nil")
	}

	// Check that it's a resource not found error
	var usecaseErr *usecase.Error
	if !errors.As(err, &usecaseErr) || usecaseErr.Kind != usecase.ErrResourceNotFound {
		t.Errorf("Expected ErrResourceNotFound, got %v", err)
	}
}
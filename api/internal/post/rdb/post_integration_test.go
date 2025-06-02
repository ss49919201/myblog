package rdb_test

import (
	"context"
	"database/sql"
	"testing"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/ss49919201/myblog/api/internal/post/entity/post"
	"github.com/ss49919201/myblog/api/internal/post/rdb"
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

func TestFindPostByID_Integration(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	ctx := context.Background()

	// Create a test post
	testPost, err := post.Construct("Test Title", "Test Body Content")
	if err != nil {
		t.Fatalf("Failed to construct test post: %v", err)
	}

	// Save the test post
	err = rdb.SavePost(ctx, db, testPost)
	if err != nil {
		t.Fatalf("Failed to save test post: %v", err)
	}

	// Test finding the post by ID
	foundPost, err := rdb.FindPostByID(ctx, db, testPost.ID)
	if err != nil {
		t.Fatalf("Failed to find post by ID: %v", err)
	}

	// Verify the found post matches the original
	if foundPost.ID != testPost.ID {
		t.Errorf("Expected ID %v, got %v", testPost.ID, foundPost.ID)
	}
	if foundPost.Title != testPost.Title {
		t.Errorf("Expected title %v, got %v", testPost.Title, foundPost.Title)
	}
	if foundPost.Body != testPost.Body {
		t.Errorf("Expected body %v, got %v", testPost.Body, foundPost.Body)
	}
}

func TestFindPostByID_NotFound_Integration(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	ctx := context.Background()

	// Try to find a non-existent post
	nonExistentID := post.NewPostID()
	_, err := rdb.FindPostByID(ctx, db, nonExistentID)
	if err == nil {
		t.Fatal("Expected error for non-existent post, got nil")
	}

	expectedError := "post not found"
	if err.Error() != expectedError {
		t.Errorf("Expected error %q, got %q", expectedError, err.Error())
	}
}

func TestSavePost_Integration(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	ctx := context.Background()

	// Create a test post
	testPost, err := post.Construct("Test Save Title", "Test Save Body Content")
	if err != nil {
		t.Fatalf("Failed to construct test post: %v", err)
	}

	// Save the test post
	err = rdb.SavePost(ctx, db, testPost)
	if err != nil {
		t.Fatalf("Failed to save test post: %v", err)
	}

	// Verify the post was saved by trying to find it
	foundPost, err := rdb.FindPostByID(ctx, db, testPost.ID)
	if err != nil {
		t.Fatalf("Failed to find saved post: %v", err)
	}

	// Verify the found post matches the original
	if foundPost.ID != testPost.ID {
		t.Errorf("Expected ID %v, got %v", testPost.ID, foundPost.ID)
	}
	if foundPost.Title != testPost.Title {
		t.Errorf("Expected title %v, got %v", testPost.Title, foundPost.Title)
	}
	if foundPost.Body != testPost.Body {
		t.Errorf("Expected body %v, got %v", testPost.Body, foundPost.Body)
	}

	// Check that created_at is within a reasonable timeframe
	timeDiff := time.Since(foundPost.CreatedAt)
	if timeDiff > time.Minute {
		t.Errorf("Created at timestamp seems too old: %v", foundPost.CreatedAt)
	}
}
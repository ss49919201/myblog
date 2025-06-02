package rdb

import (
	"reflect"
	"testing"
)

func TestCriteriaFindPosts_Build(t *testing.T) {
	tests := []struct {
		name     string
		criteria CriteriaFindPosts
		wantSQL  string
		wantArgs []any
	}{
		{
			name:     "no criteria",
			criteria: NewCriteriaFindPosts(),
			wantSQL:  "SELECT id, title, body, created_at, published_at FROM posts",
			wantArgs: []any{},
		},
		{
			name:     "single string equality",
			criteria: NewCriteriaFindPosts().Eq(ExprEqID("test-id")),
			wantSQL:  "SELECT id, title, body, created_at, published_at FROM posts WHERE id = ?",
			wantArgs: []any{"test-id"},
		},
		{
			name:     "single int64 equality",
			criteria: NewCriteriaFindPosts().Eq(ExprEqPublishedAtMillSec(1640995200000)),
			wantSQL:  "SELECT id, title, body, created_at, published_at FROM posts WHERE published_at = ?",
			wantArgs: []any{int64(1640995200000)},
		},
		{
			name: "multiple criteria",
			criteria: NewCriteriaFindPosts().
				Eq(ExprEqID("test-id")).
				Eq(ExprEqPublishedAtMillSec(1640995200000)),
			wantSQL:  "SELECT id, title, body, created_at, published_at FROM posts WHERE id = ? AND published_at = ?",
			wantArgs: []any{"test-id", int64(1640995200000)},
		},
		{
			name: "nested AND condition",
			criteria: NewCriteriaFindPosts().
				And(
					NewCriteriaFindPosts().Eq(ExprEqID("test-id")),
					NewCriteriaFindPosts().Eq(ExprEqPublishedAtMillSec(1640995200000)),
				),
			wantSQL:  "SELECT id, title, body, created_at, published_at FROM posts WHERE ((id = ?) AND (published_at = ?))",
			wantArgs: []any{"test-id", int64(1640995200000)},
		},
		{
			name: "nested OR condition",
			criteria: NewCriteriaFindPosts().
				Or(
					NewCriteriaFindPosts().Eq(ExprEqID("test-id-1")),
					NewCriteriaFindPosts().Eq(ExprEqID("test-id-2")),
				),
			wantSQL:  "SELECT id, title, body, created_at, published_at FROM posts WHERE ((id = ?) OR (id = ?))",
			wantArgs: []any{"test-id-1", "test-id-2"},
		},
		{
			name: "mixed conditions",
			criteria: NewCriteriaFindPosts().
				Eq(ExprEqPublishedAtMillSec(1640995200000)).
				Or(
					NewCriteriaFindPosts().Eq(ExprEqID("test-id-1")),
					NewCriteriaFindPosts().Eq(ExprEqID("test-id-2")),
				),
			wantSQL:  "SELECT id, title, body, created_at, published_at FROM posts WHERE published_at = ? AND ((id = ?) OR (id = ?))",
			wantArgs: []any{int64(1640995200000), "test-id-1", "test-id-2"},
		},
		{
			name: "complex nested conditions",
			criteria: NewCriteriaFindPosts().
				And(
					Or(
						NewCriteriaFindPosts().Eq(ExprEqID("id-1")),
						NewCriteriaFindPosts().Eq(ExprEqID("id-2")),
					),
					NewCriteriaFindPosts().Eq(ExprEqPublishedAtMillSec(1640995200000)),
				),
			wantSQL:  "SELECT id, title, body, created_at, published_at FROM posts WHERE (((id = ?) OR (id = ?)) AND (published_at = ?))",
			wantArgs: []any{"id-1", "id-2", int64(1640995200000)},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotSQL, gotArgs := tt.criteria.Build()
			if gotSQL != tt.wantSQL {
				t.Errorf("Build() gotSQL = %v, want %v", gotSQL, tt.wantSQL)
			}
			if !reflect.DeepEqual(gotArgs, tt.wantArgs) {
				t.Errorf("Build() gotArgs = %v, want %v", gotArgs, tt.wantArgs)
			}
		})
	}
}

func TestExprEqID(t *testing.T) {
	expr := ExprEqID("test-value")

	if expr.Field() != "id" {
		t.Errorf("ExprEqID.Field() = %v, want %v", expr.Field(), "id")
	}

	if expr.Value() != "test-value" {
		t.Errorf("ExprEqID.Value() = %v, want %v", expr.Value(), "test-value")
	}

	if expr.ValueAsAny() != "test-value" {
		t.Errorf("ExprEqID.ValueAsAny() = %v, want %v", expr.ValueAsAny(), "test-value")
	}
}

func TestExprEqPublishedAtMillSec(t *testing.T) {
	expr := ExprEqPublishedAtMillSec(1640995200000)

	if expr.Field() != "published_at" {
		t.Errorf("ExprEqPublishedAtMillSec.Field() = %v, want %v", expr.Field(), "published_at")
	}

	if expr.Value() != int64(1640995200000) {
		t.Errorf("ExprEqPublishedAtMillSec.Value() = %v, want %v", expr.Value(), int64(1640995200000))
	}

	if expr.ValueAsAny() != int64(1640995200000) {
		t.Errorf("ExprEqPublishedAtMillSec.ValueAsAny() = %v, want %v", expr.ValueAsAny(), int64(1640995200000))
	}
}

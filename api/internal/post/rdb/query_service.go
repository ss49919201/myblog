package rdb

import (
	"context"
	"database/sql"
	"encoding/json"
	"strings"
	"time"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
)

type FieldFindPosts string

const (
	ID                 FieldFindPosts = "id"
	Name               FieldFindPosts = "name"
	PublishedAtMillSec FieldFindPosts = "published_at"
)

type exprEqID struct {
	value string
}

func (e *exprEqID) Field() string {
	return "id"
}

func (e *exprEqID) Value() string {
	return e.value
}

func (e *exprEqID) ValueAsAny() any {
	return e.value
}

func ExprEqID(v string) ExprEq[string] {
	return &exprEqID{value: v}
}

type exprEqPublishedAtMillSec struct {
	value int64
}

func (e *exprEqPublishedAtMillSec) Field() string {
	return "published_at"
}

func (e *exprEqPublishedAtMillSec) Value() int64 {
	return e.value
}

func (e *exprEqPublishedAtMillSec) ValueAsAny() any {
	return e.value
}

func ExprEqPublishedAtMillSec(v int64) ExprEq[int64] {
	return &exprEqPublishedAtMillSec{value: v}
}

type ExprEq[T any] interface {
	Field() string
	Value() T
	ValueAsAny() any
}

type Expr interface {
	Field() string
	ValueAsAny() any
}

type CriteriaFindPosts interface {
	Eq(expr Expr) CriteriaFindPosts
	And(conditions ...CriteriaFindPosts) CriteriaFindPosts
	Or(conditions ...CriteriaFindPosts) CriteriaFindPosts
	Build() (string, []any)
}

type criteriaFindPosts struct {
	exprs         []Expr
	andConditions []CriteriaFindPosts
	orConditions  []CriteriaFindPosts
}

func NewCriteriaFindPosts() CriteriaFindPosts {
	return &criteriaFindPosts{
		exprs:         make([]Expr, 0),
		andConditions: make([]CriteriaFindPosts, 0),
		orConditions:  make([]CriteriaFindPosts, 0),
	}
}

func And(conditions ...CriteriaFindPosts) CriteriaFindPosts {
	return NewCriteriaFindPosts().And(conditions...)
}

func Or(conditions ...CriteriaFindPosts) CriteriaFindPosts {
	return NewCriteriaFindPosts().Or(conditions...)
}

func (c *criteriaFindPosts) Eq(expr Expr) CriteriaFindPosts {
	c.exprs = append(c.exprs, expr)
	return c
}

func (c *criteriaFindPosts) And(conditions ...CriteriaFindPosts) CriteriaFindPosts {
	c.andConditions = append(c.andConditions, conditions...)
	return c
}

func (c *criteriaFindPosts) Or(conditions ...CriteriaFindPosts) CriteriaFindPosts {
	c.orConditions = append(c.orConditions, conditions...)
	return c
}

func (c *criteriaFindPosts) Build() (string, []any) {
	return buildQuery(c)
}

func buildQuery(criteria *criteriaFindPosts) (string, []any) {
	baseQuery := "SELECT BIN_TO_UUID(id), title, body, status, scheduled_at, category, tags, featured_image_url, meta_description, slug, sns_auto_post, external_notification, emergency_flag, created_at, published_at FROM posts"

	whereClause, args := buildWhereClause(criteria)
	if whereClause == "" {
		return baseQuery, []any{}
	}

	return baseQuery + " WHERE " + whereClause, args
}

func buildWhereClause(criteria *criteriaFindPosts) (string, []any) {
	var whereParts []string
	var args []any

	// Handle simple expressions
	for _, expr := range criteria.exprs {
		whereParts = append(whereParts, expr.Field()+" = ?")
		args = append(args, expr.ValueAsAny())
	}

	// Handle AND conditions
	if len(criteria.andConditions) > 0 {
		andPart, andArgs := buildAndConditions(criteria.andConditions)
		if andPart != "" {
			whereParts = append(whereParts, "("+andPart+")")
			args = append(args, andArgs...)
		}
	}

	// Handle OR conditions
	if len(criteria.orConditions) > 0 {
		orPart, orArgs := buildOrConditions(criteria.orConditions)
		if orPart != "" {
			whereParts = append(whereParts, "("+orPart+")")
			args = append(args, orArgs...)
		}
	}

	if len(whereParts) == 0 {
		return "", []any{}
	}

	whereClause := whereParts[0]
	for i := 1; i < len(whereParts); i++ {
		whereClause += " AND " + whereParts[i]
	}

	return whereClause, args
}

func buildAndConditions(conditions []CriteriaFindPosts) (string, []any) {
	if len(conditions) == 0 {
		return "", []any{}
	}

	var parts []string
	var args []any

	for _, condition := range conditions {
		if cond, ok := condition.(*criteriaFindPosts); ok {
			part, condArgs := buildWhereClause(cond)
			if part != "" {
				// Only add parentheses if the part contains multiple conditions
				if strings.Contains(part, " AND ") || strings.Contains(part, " OR ") {
					parts = append(parts, "("+part+")")
				} else {
					parts = append(parts, part)
				}
				args = append(args, condArgs...)
			}
		}
	}

	if len(parts) == 0 {
		return "", []any{}
	}

	if len(parts) == 1 {
		return parts[0], args
	}

	query := parts[0]
	for i := 1; i < len(parts); i++ {
		query += " AND " + parts[i]
	}

	return query, args
}

func buildOrConditions(conditions []CriteriaFindPosts) (string, []any) {
	if len(conditions) == 0 {
		return "", []any{}
	}

	var parts []string
	var args []any

	for _, condition := range conditions {
		if cond, ok := condition.(*criteriaFindPosts); ok {
			part, condArgs := buildWhereClause(cond)
			if part != "" {
				// Only add parentheses if the part contains multiple conditions
				if strings.Contains(part, " AND ") || strings.Contains(part, " OR ") {
					parts = append(parts, "("+part+")")
				} else {
					parts = append(parts, part)
				}
				args = append(args, condArgs...)
			}
		}
	}

	if len(parts) == 0 {
		return "", []any{}
	}

	if len(parts) == 1 {
		return parts[0], args
	}

	query := parts[0]
	for i := 1; i < len(parts); i++ {
		query += " OR " + parts[i]
	}

	return query, args
}

func FindPosts(ctx context.Context, db *sql.DB, criteria CriteriaFindPosts) ([]*post.Post, error) {
	query, args := criteria.Build()

	rows, err := db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts := make([]*post.Post, 0)

	for rows.Next() {
		var id, title, body, status, category string
		var scheduledAt, publishedAt *time.Time
		var tagsJSON, featuredImageURL, metaDescription, slug *string
		var snsAutoPost, externalNotification, emergencyFlag bool
		var createdAt time.Time

		err := rows.Scan(&id, &title, &body, &status, &scheduledAt, &category, &tagsJSON, &featuredImageURL, &metaDescription, &slug, &snsAutoPost, &externalNotification, &emergencyFlag, &createdAt, &publishedAt)
		if err != nil {
			return nil, err
		}

		postID, err := post.ParsePostID(id)
		if err != nil {
			return nil, err
		}

		// tagsをパース
		var tags []string
		if tagsJSON != nil {
			if err := json.Unmarshal([]byte(*tagsJSON), &tags); err != nil {
				tags = []string{}
			}
		}

		p, err := post.Reconstruct(postID, title, body, post.PublicationStatus(status), scheduledAt, category, tags, featuredImageURL, metaDescription, slug, snsAutoPost, externalNotification, emergencyFlag, createdAt, publishedAt)
		if err != nil {
			return nil, err
		}

		posts = append(posts, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}

// FindAllPosts retrieves all posts ordered by created_at DESC
func FindAllPosts(ctx context.Context, db *sql.DB) ([]*post.Post, error) {
	query := "SELECT BIN_TO_UUID(id) as id, title, body, status, scheduled_at, category, tags, featured_image_url, meta_description, slug, sns_auto_post, external_notification, emergency_flag, created_at, published_at FROM posts ORDER BY created_at DESC"

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts := make([]*post.Post, 0)

	for rows.Next() {
		var id, title, body, status, category string
		var scheduledAt, publishedAt *time.Time
		var tagsJSON, featuredImageURL, metaDescription, slug *string
		var snsAutoPost, externalNotification, emergencyFlag bool
		var createdAt time.Time

		err := rows.Scan(&id, &title, &body, &status, &scheduledAt, &category, &tagsJSON, &featuredImageURL, &metaDescription, &slug, &snsAutoPost, &externalNotification, &emergencyFlag, &createdAt, &publishedAt)
		if err != nil {
			return nil, err
		}

		postID, err := post.ParsePostID(id)
		if err != nil {
			return nil, err
		}

		// tagsをパース
		var tags []string
		if tagsJSON != nil {
			if err := json.Unmarshal([]byte(*tagsJSON), &tags); err != nil {
				tags = []string{}
			}
		}

		p, err := post.Reconstruct(postID, title, body, post.PublicationStatus(status), scheduledAt, category, tags, featuredImageURL, metaDescription, slug, snsAutoPost, externalNotification, emergencyFlag, createdAt, publishedAt)
		if err != nil {
			return nil, err
		}

		posts = append(posts, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}

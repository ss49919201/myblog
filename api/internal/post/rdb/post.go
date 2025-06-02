package rdb

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
)

func FindPostByID(ctx context.Context, db *sql.DB, id post.PostID) (*post.Post, error) {
	query := `SELECT BIN_TO_UUID(id), title, body, created_at, published_at FROM posts WHERE id = UUID_TO_BIN(?)`
	
	row := db.QueryRowContext(ctx, query, string(id))
	
	var idStr, title, body string
	var createdAt, publishedAt time.Time
	
	err := row.Scan(&idStr, &title, &body, &createdAt, &publishedAt)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("post not found")
		}
		return nil, err
	}
	
	postID, err := post.ParsePostID(idStr)
	if err != nil {
		return nil, err
	}
	
	p, err := post.Reconstruct(postID, title, body, createdAt)
	if err != nil {
		return nil, err
	}
	
	return p, nil
}

func SavePost(ctx context.Context, db *sql.DB, p *post.Post) error {
	query := `INSERT INTO posts (id, title, body, created_at, published_at) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?)`
	
	_, err := db.ExecContext(ctx, query, string(p.ID), p.Title, p.Body, p.CreatedAt, p.PublishedAt)
	return err
}

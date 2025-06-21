package rdb

import (
	"context"
	"database/sql"
	"errors"
	"time"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
	"github.com/ss49919201/myblog/api/internal/post/repository"
)

type PostRepositoryImpl struct {
	db *sql.DB
}

func NewPostRepository(db *sql.DB) repository.PostRepository {
	return &PostRepositoryImpl{db: db}
}

func (r *PostRepositoryImpl) Create(ctx context.Context, p *post.Post) error {
	query := `INSERT INTO posts (id, title, body, created_at, published_at) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?)`

	_, err := r.db.ExecContext(ctx, query, p.ID.String(), p.Title, p.Body, p.CreatedAt, p.PublishedAt)
	return err
}

func (r *PostRepositoryImpl) FindByID(ctx context.Context, id post.PostID) (*post.Post, error) {
	query := `SELECT BIN_TO_UUID(id), title, body, created_at, published_at FROM posts WHERE id = UUID_TO_BIN(?)`

	row := r.db.QueryRowContext(ctx, query, id.String())

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

	p, err := post.Reconstruct(postID, title, body, createdAt, publishedAt)
	if err != nil {
		return nil, err
	}

	return p, nil
}

func (r *PostRepositoryImpl) Update(ctx context.Context, p *post.Post) error {
	query := `UPDATE posts SET title = ?, body = ?, published_at = ? WHERE id = UUID_TO_BIN(?)`

	result, err := r.db.ExecContext(ctx, query, p.Title, p.Body, p.PublishedAt, p.ID.String())
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("post not found")
	}

	return nil
}

func (r *PostRepositoryImpl) Delete(ctx context.Context, id post.PostID) error {
	query := `DELETE FROM posts WHERE id = UUID_TO_BIN(?)`

	result, err := r.db.ExecContext(ctx, query, id.String())
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return errors.New("post not found")
	}

	return nil
}

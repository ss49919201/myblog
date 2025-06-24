package rdb

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strings"
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
	query := `INSERT INTO posts (id, title, body, status, scheduled_at, category, tags, featured_image_url, meta_description, slug, sns_auto_post, external_notification, emergency_flag, created_at, published_at) VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	// tagsをJSON文字列に変換
	var tagsJSON *string
	if len(p.Tags) > 0 {
		tagsStr := `["` + strings.Join(p.Tags, `","`) + `"]`
		tagsJSON = &tagsStr
	}

	_, err := r.db.ExecContext(ctx, query, 
		p.ID.String(), 
		p.Title, 
		p.Body, 
		p.Status, 
		p.ScheduledAt, 
		p.Category, 
		tagsJSON, 
		p.FeaturedImageURL, 
		p.MetaDescription, 
		p.Slug, 
		p.SNSAutoPost, 
		p.ExternalNotification, 
		p.EmergencyFlag, 
		p.CreatedAt, 
		p.PublishedAt,
	)
	return err
}

func (r *PostRepositoryImpl) FindByID(ctx context.Context, id post.PostID) (*post.Post, error) {
	query := `SELECT BIN_TO_UUID(id), title, body, status, scheduled_at, category, tags, featured_image_url, meta_description, slug, sns_auto_post, external_notification, emergency_flag, created_at, published_at FROM posts WHERE id = UUID_TO_BIN(?)`

	row := r.db.QueryRowContext(ctx, query, id.String())

	var idStr, title, body, status, category string
	var scheduledAt, publishedAt *time.Time
	var tagsJSON, featuredImageURL, metaDescription, slug *string
	var snsAutoPost, externalNotification, emergencyFlag bool
	var createdAt time.Time

	err := row.Scan(&idStr, &title, &body, &status, &scheduledAt, &category, &tagsJSON, &featuredImageURL, &metaDescription, &slug, &snsAutoPost, &externalNotification, &emergencyFlag, &createdAt, &publishedAt)
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

	return p, nil
}

func (r *PostRepositoryImpl) Update(ctx context.Context, p *post.Post) error {
	query := `UPDATE posts SET title = ?, body = ?, status = ?, scheduled_at = ?, category = ?, tags = ?, featured_image_url = ?, meta_description = ?, slug = ?, sns_auto_post = ?, external_notification = ?, emergency_flag = ?, published_at = ? WHERE id = UUID_TO_BIN(?)`

	// tagsをJSON文字列に変換
	var tagsJSON *string
	if len(p.Tags) > 0 {
		tagsStr := `["` + strings.Join(p.Tags, `","`) + `"]`
		tagsJSON = &tagsStr
	}

	result, err := r.db.ExecContext(ctx, query, 
		p.Title, 
		p.Body, 
		p.Status, 
		p.ScheduledAt, 
		p.Category, 
		tagsJSON, 
		p.FeaturedImageURL, 
		p.MetaDescription, 
		p.Slug, 
		p.SNSAutoPost, 
		p.ExternalNotification, 
		p.EmergencyFlag, 
		p.PublishedAt, 
		p.ID.String(),
	)
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

func (r *PostRepositoryImpl) CountScheduledSameDayByCategory(ctx context.Context, category string, scheduledAt time.Time) (int, error) {
	// 同じ日付の0時～23:59:59の範囲でカウント
	startOfDay := time.Date(scheduledAt.Year(), scheduledAt.Month(), scheduledAt.Day(), 0, 0, 0, 0, scheduledAt.Location())
	endOfDay := startOfDay.Add(24 * time.Hour).Add(-1 * time.Nanosecond)

	query := `SELECT COUNT(*) FROM posts WHERE category = ? AND status = 'scheduled' AND scheduled_at >= ? AND scheduled_at <= ?`

	row := r.db.QueryRowContext(ctx, query, category, startOfDay, endOfDay)

	var count int
	err := row.Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

package repository

import (
	"context"
	"time"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
)

type PostRepository interface {
	Create(ctx context.Context, p *post.Post) error
	FindByID(ctx context.Context, id post.PostID) (*post.Post, error)
	Update(ctx context.Context, p *post.Post) error
	Delete(ctx context.Context, id post.PostID) error
	CountScheduledSameDayByCategory(ctx context.Context, category string, scheduledAt time.Time) (int, error)
}

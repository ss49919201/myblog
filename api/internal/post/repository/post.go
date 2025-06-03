package repository

import (
	"context"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
)

type PostRepository interface {
	Save(ctx context.Context, p *post.Post) error
	Update(ctx context.Context, p *post.Post) error
	Delete(ctx context.Context, id post.PostID) error
}
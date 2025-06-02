package usecase

import (
	"context"
	"database/sql"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
	"github.com/ss49919201/myblog/api/internal/post/rdb"
)

type GetPostInput struct {
	ID string
}

type GetPostOutput struct {
	Post *post.Post
}

func GetPost(ctx context.Context, db *sql.DB, input GetPostInput) (*GetPostOutput, error) {
	postID, err := post.ParsePostID(input.ID)
	if err != nil {
		return nil, NewError(ErrInvalidParameter, err)
	}

	foundPost, err := rdb.FindPostByID(ctx, db, postID)
	if err != nil {
		return nil, NewError(ErrResourceNotFound, err)
	}

	return &GetPostOutput{
		Post: foundPost,
	}, nil
}
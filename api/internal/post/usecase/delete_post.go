package usecase

import (
	"context"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
	"github.com/ss49919201/myblog/api/internal/post/repository"
)

type DeletePostInput struct {
	ID string `json:"id"`
}

type DeletePostUsecase struct {
	repo repository.PostRepository
}

func NewDeletePostUsecase(repo repository.PostRepository) *DeletePostUsecase {
	return &DeletePostUsecase{repo: repo}
}

func (u *DeletePostUsecase) Execute(ctx context.Context, input DeletePostInput) error {
	postID, err := post.ParsePostID(input.ID)
	if err != nil {
		return err
	}

	return u.repo.Delete(ctx, postID)
}
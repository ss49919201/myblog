package usecase

import (
	"context"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
	"github.com/ss49919201/myblog/api/internal/post/repository"
)

type CreatePostInput struct {
	Title string `json:"title"`
	Body  string `json:"body"`
}

type CreatePostOutput struct {
	Post *post.Post `json:"post"`
}

type CreatePostUsecase struct {
	repo repository.PostRepository
}

func NewCreatePostUsecase(repo repository.PostRepository) *CreatePostUsecase {
	return &CreatePostUsecase{repo: repo}
}

func (u *CreatePostUsecase) Execute(ctx context.Context, input CreatePostInput) (*CreatePostOutput, error) {
	p, err := post.Construct(input.Title, input.Body)
	if err != nil {
		return nil, err
	}

	if err := u.repo.Create(ctx, p); err != nil {
		return nil, err
	}

	return &CreatePostOutput{Post: p}, nil
}

package usecase

import (
	"context"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
	"github.com/ss49919201/myblog/api/internal/post/repository"
)

type UpdatePostInput struct {
	ID    string `json:"id"`
	Title string `json:"title"`
	Body  string `json:"body"`
}

type UpdatePostOutput struct {
	Post *post.Post `json:"post"`
}

type UpdatePostUsecase struct {
	repo repository.PostRepository
}

func NewUpdatePostUsecase(repo repository.PostRepository) *UpdatePostUsecase {
	return &UpdatePostUsecase{repo: repo}
}

func (u *UpdatePostUsecase) Execute(ctx context.Context, input UpdatePostInput) (*UpdatePostOutput, error) {
	postID, err := post.ParsePostID(input.ID)
	if err != nil {
		return nil, err
	}

	p, err := post.Construct(input.Title, input.Body)
	if err != nil {
		return nil, err
	}
	
	p.ID = postID

	if err := u.repo.Update(ctx, p); err != nil {
		return nil, err
	}

	return &UpdatePostOutput{Post: p}, nil
}
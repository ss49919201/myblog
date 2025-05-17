package usecase

import (
	"context"
	"time"

	"github.com/ss49919201/myblog/api/internal/entity/post"
)

type UpdatePostInput struct {
	ID    string
	Title string
	Body  string
}

type UpdatePostOutput struct {
	Post *post.Post
}

func UpdatePost(ctx context.Context, input UpdatePostInput) (*UpdatePostOutput, error) {
	if err := post.ValidateForConstruct(input.Title, input.Body); err != nil {
		return nil, NewErrInvalidParameter(err)
	}

	id, err := post.ParsePostID(input.ID)
	if err != nil {
		return nil, NewErrInvalidParameter(err)
	}

	return &UpdatePostOutput{
		Post: &post.Post{
			ID:          id,
			Title:       input.Title,
			Body:        input.Body,
			CreatedAt:   time.Now(),
			PublishedAt: time.Now(),
		},
	}, nil
}

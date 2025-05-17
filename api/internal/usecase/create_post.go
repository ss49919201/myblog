package usecase

import (
	"context"

	"github.com/ss49919201/myblog/api/internal/entity/post"
)

type CreatePostInput struct {
	Title string
	Body  string
}

type CreatePostOutput struct {
	Post *post.Post
}

func CreatePost(ctx context.Context, input CreatePostInput) (*CreatePostOutput, error) {
	if err := post.ValidateForConstruct(input.Title, input.Body); err != nil {
		return nil, NewError(ErrInvalidParameter, err)
	}

	newPost, err := post.Construct(input.Title, input.Body)
	if err != nil {
		return nil, err
	}

	return &CreatePostOutput{
		Post: newPost,
	}, nil
}

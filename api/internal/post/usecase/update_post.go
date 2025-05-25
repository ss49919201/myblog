package usecase

import (
	"context"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
)

type UpdatePostInput struct {
	ID    string
	Title string
	Body  string
}

type UpdatePostDependency struct {
	FindPostByID func(id post.PostID) (*post.Post, error)
	SavePost     func(post *post.Post) error
}

type UpdatePostOutput struct {
	Post *post.Post
}

func UpdatePost(ctx context.Context, dep *UpdatePostDependency, input *UpdatePostInput) (*UpdatePostOutput, error) {
	if err := post.ValidateForConstruct(input.Title, input.Body); err != nil {
		return nil, NewError(ErrInvalidParameter, err)
	}

	id, err := post.ParsePostID(input.ID)
	if err != nil {
		return nil, NewError(ErrInvalidParameter, err)
	}

	existingPost, err := dep.FindPostByID(id)
	if err != nil {
		return nil, NewError(ErrResourceNotFound, err)
	}

	if err := existingPost.Update(input.Title, input.Body); err != nil {
		return nil, NewError(ErrInvalidParameter, err)
	}

	if err := dep.SavePost(existingPost); err != nil {
		return nil, err
	}

	return &UpdatePostOutput{
		Post: existingPost,
	}, nil
}

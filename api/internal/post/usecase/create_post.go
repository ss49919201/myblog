package usecase

import (
	"context"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
	"github.com/ss49919201/myblog/api/internal/post/event"
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
	repo       repository.PostRepository
	dispatcher event.EventDispatcher
}

func NewCreatePostUsecase(repo repository.PostRepository, dispatcher event.EventDispatcher) *CreatePostUsecase {
	return &CreatePostUsecase{repo: repo, dispatcher: dispatcher}
}

func (u *CreatePostUsecase) Execute(ctx context.Context, input CreatePostInput) (*CreatePostOutput, error) {
	p, err := post.Construct(input.Title, input.Body)
	if err != nil {
		return nil, err
	}

	if err := u.repo.Create(ctx, p); err != nil {
		return nil, err
	}

	if err := u.dispatcher.DispatchEvents(ctx, p.Events); err != nil {
		// イベント配信失敗はログに記録するが、処理は続行
		// TODO: ログ出力を追加
	}

	return &CreatePostOutput{Post: p}, nil
}

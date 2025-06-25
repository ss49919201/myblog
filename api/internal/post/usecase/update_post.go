package usecase

import (
	"context"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
	"github.com/ss49919201/myblog/api/internal/post/event"
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
	repo       repository.PostRepository
	dispatcher event.EventDispatcher
}

func NewUpdatePostUsecase(repo repository.PostRepository, dispatcher event.EventDispatcher) *UpdatePostUsecase {
	return &UpdatePostUsecase{repo: repo, dispatcher: dispatcher}
}

func (u *UpdatePostUsecase) Execute(ctx context.Context, input UpdatePostInput) (*UpdatePostOutput, error) {
	postID, err := post.ParsePostID(input.ID)
	if err != nil {
		return nil, err
	}

	existingPost, err := u.repo.FindByID(ctx, postID)
	if err != nil {
		return nil, err
	}

	if err := existingPost.Update(input.Title, input.Body); err != nil {
		return nil, err
	}

	if err := u.repo.Update(ctx, existingPost); err != nil {
		return nil, err
	}

	if err := u.dispatcher.DispatchEvents(ctx, existingPost.Events); err != nil {
		// イベント配信失敗はログに記録するが、処理は続行
		// TODO: ログ出力を追加
	}

	return &UpdatePostOutput{Post: existingPost}, nil
}

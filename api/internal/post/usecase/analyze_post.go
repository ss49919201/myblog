package usecase

import (
	"context"
	"fmt"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
)

type AnalyzePostInput struct {
	ID string `json:"id"`
}

type AnalyzePostOutput struct {
	ID       string `json:"id"`
	Analysis string `json:"analysis"`
}

type AnalyzePostUsecase struct {
}

func NewAnalyzePostUsecase() *AnalyzePostUsecase {
	return &AnalyzePostUsecase{}
}

func (u *AnalyzePostUsecase) Execute(ctx context.Context, input AnalyzePostInput) (*AnalyzePostOutput, error) {
	postID, err := post.ParsePostID(input.ID)
	if err != nil {
		return nil, err
	}

	analysis := fmt.Sprintf("Analysis for post %s: This is a sample analysis.", string(postID))

	return &AnalyzePostOutput{
		ID:       string(postID),
		Analysis: analysis,
	}, nil
}
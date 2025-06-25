package usecase

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
	"github.com/ss49919201/myblog/api/internal/post/event"
	"github.com/ss49919201/myblog/api/internal/post/repository"
)


type CreatePostInput struct {
	Title                string                    `json:"title"`
	Body                 string                    `json:"body"`
	Status               post.PublicationStatus    `json:"status"`
	ScheduledAt          *time.Time                `json:"scheduledAt"`
	Category             string                    `json:"category"`
	Tags                 []string                  `json:"tags"`
	FeaturedImageURL     *string                   `json:"featuredImageURL"`
	MetaDescription      *string                   `json:"metaDescription"`
	Slug                 *string                   `json:"slug"`
	SNSAutoPost          bool                      `json:"snsAutoPost"`
	ExternalNotification bool                      `json:"externalNotification"`
	EmergencyFlag        bool                      `json:"emergencyFlag"`
}

type UserContext struct {
	Role post.UserRole `json:"role"`
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

func (u *CreatePostUsecase) Execute(ctx context.Context, input CreatePostInput, userCtx UserContext) (*CreatePostOutput, error) {
	// 1. 基本バリデーション（常時）
	// タイトル：必須、1-100文字、禁止文字チェック
	if len(input.Title) < 1 || len(input.Title) > 100 {
		return nil, post.NewValidationError("title", "title must be between 1 and 100 characters")
	}
	forbiddenChars := []string{"<", ">", "\"", "'", "&"}
	for _, char := range forbiddenChars {
		if strings.Contains(input.Title, char) {
			return nil, post.NewValidationError("title", "title contains forbidden characters")
		}
	}

	// 内容：必須、100-5000文字、HTMLタグ検証
	if len(input.Body) < 100 || len(input.Body) > 5000 {
		return nil, post.NewValidationError("body", "body must be between 100 and 5000 characters")
	}
	if strings.Count(input.Body, "<") != strings.Count(input.Body, ">") {
		return nil, post.NewValidationError("body", "body contains invalid HTML tags")
	}

	// 2. 権限ベースバリデーション
	switch userCtx.Role {
	case post.RoleGeneral:
		if input.Status != post.StatusDraft {
			return nil, post.NewValidationError("status", "general users can only save as draft")
		}
	case post.RoleEditor:
		if input.Status == post.StatusPublished {
			return nil, post.NewValidationError("status", "editors can only schedule posts, not publish immediately")
		}
	case post.RoleAdmin:
		// 管理者は全て可能
	default:
		return nil, post.NewValidationError("role", "invalid user role")
	}

	// 3. カテゴリ依存バリデーション
	switch input.Category {
	case "ニュース":
		if input.FeaturedImageURL == nil || *input.FeaturedImageURL == "" {
			return nil, post.NewValidationError("featuredImageURL", "news category requires featured image")
		}
	case "技術":
		if len(input.Tags) < 2 {
			return nil, post.NewValidationError("tags", "tech category requires at least 2 tags")
		}
	case "お知らせ":
		if input.ScheduledAt == nil {
			return nil, post.NewValidationError("scheduledAt", "announcement category requires scheduled time")
		}
	}

	// 4. 時間制約バリデーション
	now := time.Now()
	if input.ScheduledAt != nil {
		if input.ScheduledAt.Before(now.Add(30 * time.Minute)) {
			return nil, post.NewValidationError("scheduledAt", "scheduled time must be at least 30 minutes from now")
		}
	}

	if !input.EmergencyFlag {
		if input.Category == "ニュース" && input.Status == post.StatusPublished {
			weekday := now.Weekday()
			hour := now.Hour()
			if weekday == time.Saturday || weekday == time.Sunday || hour < 9 || hour >= 18 {
				return nil, post.NewValidationError("publishTime", "news can only be published during business hours (9-18, weekdays)")
			}
		}
	}

	// 5. 重複・関連性バリデーション
	if input.ScheduledAt != nil {
		count, err := u.repo.CountScheduledSameDayByCategory(ctx, input.Category, *input.ScheduledAt)
		if err != nil {
			return nil, fmt.Errorf("failed to check scheduled posts: %w", err)
		}
		if count >= 5 {
			return nil, post.NewValidationError("category", "too many posts scheduled for same day in this category")
		}
	}

	externalLinkCount := strings.Count(input.Body, "http://") + strings.Count(input.Body, "https://")
	if externalLinkCount >= 10 {
		return nil, post.NewValidationError("body", "posts with 10+ external links require approval workflow")
	}

	// 6. Post エンティティ作成（全パラメータ指定）
	p, err := post.Construct(
		input.Title,
		input.Body,
		input.Status,
		input.ScheduledAt,
		input.Category,
		input.Tags,
		input.FeaturedImageURL,
		input.MetaDescription,
		input.Slug,
		input.SNSAutoPost,
		input.ExternalNotification,
		input.EmergencyFlag,
	)
	if err != nil {
		return nil, err
	}

	// 7. リトライ機能付き保存
	var lastErr error
	for attempt := 1; attempt <= 3; attempt++ {
		if err := u.repo.Create(ctx, p); err == nil {
			break
		} else {
			lastErr = err
			if attempt < 3 {
				time.Sleep(time.Duration(attempt) * time.Second)
			}
		}
	}
	if lastErr != nil {
		return nil, fmt.Errorf("failed to save post after 3 attempts: %w", lastErr)
	}

	// 8. イベント配信（既存パターンに従う）
	if err := u.dispatcher.DispatchEvents(ctx, p.Events); err != nil {
		// イベント配信失敗はログに記録するが、処理は続行
		// TODO: ログ出力を追加
	}

	return &CreatePostOutput{Post: p}, nil
}

package event

import (
	"context"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
)

type EventDispatcher interface {
	DispatchEvents(ctx context.Context, events []post.PostEvent) error
}
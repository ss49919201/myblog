package event

import (
	"context"

	"github.com/ss49919201/myblog/api/internal/post/entity/post"
)

type NoopEventDispatcher struct{}

func NewNoopEventDispatcher() *NoopEventDispatcher {
	return &NoopEventDispatcher{}
}

func (d *NoopEventDispatcher) DispatchEvents(ctx context.Context, events []post.PostEvent) error {
	// 現在は何も処理しない（no-op）
	// 将来的にはイベントハンドラーの呼び出しやメッセージキューへの送信を実装
	return nil
}
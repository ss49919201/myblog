package markdown

import (
	"bytes"
	"fmt"
	"strings"
	"time"

	"github.com/ss49919201/myblog/tools/internal/content"
	"github.com/yuin/goldmark"
	"github.com/yuin/goldmark/extension"
	"github.com/yuin/goldmark/parser"
	meta "github.com/yuin/goldmark-meta"
)

type Document struct {
	Title       string
	Slug        string
	PublishedAt time.Time
	HTML        string
}

func Convert(source []byte) (Document, error) {
	md := goldmark.New(
		goldmark.WithExtensions(
			extension.GFM,
			meta.Meta,
		),
	)
	ctx := parser.NewContext()
	var html bytes.Buffer
	if err := md.Convert(source, &html, parser.WithContext(ctx)); err != nil {
		return Document{}, err
	}
	metaMap, err := meta.TryGet(ctx)
	if err != nil {
		return Document{}, fmt.Errorf("frontmatter: %w", err)
	}
	if metaMap == nil {
		return Document{}, fmt.Errorf("frontmatter がありません")
	}

	title, err := metaString(metaMap, "title")
	if err != nil {
		return Document{}, err
	}
	slugRaw, err := metaString(metaMap, "slug")
	if err != nil {
		return Document{}, err
	}
	slug, err := content.ParseSlug(slugRaw)
	if err != nil {
		return Document{}, err
	}
	publishedRaw, err := metaString(metaMap, "published_at")
	if err != nil {
		return Document{}, err
	}
	publishedAt, err := content.ParseDate(publishedRaw)
	if err != nil {
		return Document{}, fmt.Errorf("published_at: %w", err)
	}

	return Document{
		Title:       title,
		Slug:        slug.String(),
		PublishedAt: publishedAt.UTC(),
		HTML:        strings.TrimSpace(html.String()),
	}, nil
}

func metaString(metaMap map[string]interface{}, key string) (string, error) {
	v, ok := metaMap[key]
	if !ok || v == nil {
		return "", fmt.Errorf("frontmatter に %q がありません", key)
	}
	switch x := v.(type) {
	case string:
		if strings.TrimSpace(x) == "" {
			return "", fmt.Errorf("frontmatter の %q が空です", key)
		}
		return x, nil
	default:
		return fmt.Sprint(x), nil
	}
}

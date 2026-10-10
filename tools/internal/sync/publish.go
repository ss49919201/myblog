package sync

import (
	"context"
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/ss49919201/myblog/tools/internal/d1client"
	"github.com/ss49919201/myblog/tools/internal/markdown"
)

type Publisher struct {
	Client *d1client.Client
	Stdout io.Writer
}

type DryRunLine struct {
	Path     string
	HTML     string
	SQL      string
	Params   []string
}

func PublishFiles(ctx context.Context, pub Publisher, paths []string, dryRun bool) error {
	for _, path := range paths {
		if err := publishOne(ctx, pub, path, dryRun); err != nil {
			return err
		}
	}
	return nil
}

func publishOne(ctx context.Context, pub Publisher, path string, dryRun bool) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return fmt.Errorf("%s: %w", path, err)
	}
	doc, err := markdown.Convert(data)
	if err != nil {
		return fmt.Errorf("%s: %w", path, err)
	}
	row := d1client.PostRow{
		Slug:        doc.Slug,
		Title:       doc.Title,
		PublishedAt: formatPublishedAt(doc.PublishedAt),
		BodyHTML:    doc.HTML,
	}
	if dryRun {
		line := DryRunLine{
			Path:   path,
			HTML:   doc.HTML,
			SQL:    d1client.UpsertSQL,
			Params: d1client.UpsertParams(row),
		}
		if _, err := fmt.Fprintf(pub.Stdout, "%s\n--- html ---\n%s\n--- sql ---\n%s\n--- params ---\n%s\n\n",
			line.Path, line.HTML, line.SQL, strings.Join(line.Params, "\n")); err != nil {
			return err
		}
		return nil
	}
	if pub.Client == nil {
		return fmt.Errorf("d1 client is not configured")
	}
	if err := pub.Client.UpsertPost(ctx, row); err != nil {
		return fmt.Errorf("%s: %w", path, err)
	}
	if _, err := fmt.Fprintf(pub.Stdout, "%s -> %s\n", path, row.Slug); err != nil {
		return err
	}
	return nil
}

func formatPublishedAt(t time.Time) string {
	return t.UTC().Format("2006-01-02T15:04:05.000Z")
}

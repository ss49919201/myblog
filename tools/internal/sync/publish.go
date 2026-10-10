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

type Report struct {
	OK     int
	Failed int
	Errors []error
}

func PublishFiles(ctx context.Context, pub Publisher, paths []string, dryRun bool) Report {
	var report Report
	for _, path := range paths {
		if err := publishOne(ctx, pub, path, dryRun); err != nil {
			report.Failed++
			report.Errors = append(report.Errors, err)
			continue
		}
		report.OK++
	}
	return report
}

func FormatSummary(w io.Writer, report Report) error {
	if _, err := fmt.Fprintf(w, "成功: %d\n失敗: %d\n", report.OK, report.Failed); err != nil {
		return err
	}
	for _, err := range report.Errors {
		if _, err := fmt.Fprintf(w, "%s\n", err); err != nil {
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
		if _, err := fmt.Fprintf(pub.Stdout, "%s\n--- html ---\n%s\n--- sql ---\n%s\n--- params ---\n%s\n\n",
			path, doc.HTML, d1client.UpsertSQL, strings.Join(d1client.UpsertParams(row), "\n")); err != nil {
			return fmt.Errorf("%s: %w", path, err)
		}
		return nil
	}
	if pub.Client == nil {
		return fmt.Errorf("%s: d1 client is not configured", path)
	}
	if err := pub.Client.UpsertPost(ctx, row); err != nil {
		return fmt.Errorf("%s: %w", path, err)
	}
	if _, err := fmt.Fprintf(pub.Stdout, "%s -> %s\n", path, row.Slug); err != nil {
		return fmt.Errorf("%s: %w", path, err)
	}
	return nil
}

func formatPublishedAt(t time.Time) string {
	return t.UTC().Format("2006-01-02T15:04:05.000Z")
}

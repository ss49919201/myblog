package sync

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/ss49919201/myblog/tools/internal/content"
	"github.com/ss49919201/myblog/tools/internal/d1client"
	"github.com/ss49919201/myblog/tools/internal/markdown"
)

type Publisher struct {
	Client *d1client.Client
	Stdout io.Writer
}

type Options struct {
	Root     string
	PostsDir string
	DryRun   bool
	Prune    bool
}

type Report struct {
	OK     int
	Failed int
	Errors []error
}

func SyncPosts(ctx context.Context, pub Publisher, opt Options) Report {
	var report Report
	postsDir := content.ResolvePostsDir(opt.PostsDir)
	paths, err := content.ListMarkdownPosts(opt.Root, postsDir)
	if err != nil {
		report.Failed++
		report.Errors = append(report.Errors, fmt.Errorf("%s: %w", postsDir, err))
		return report
	}

	type candidate struct {
		path string
		doc  markdown.Document
	}
	var ready []candidate
	slugPaths := map[string][]string{}

	for _, path := range paths {
		doc, err := loadDocument(path)
		if err != nil {
			report.Failed++
			report.Errors = append(report.Errors, err)
			continue
		}
		slugPaths[doc.Slug] = append(slugPaths[doc.Slug], path)
		ready = append(ready, candidate{path: path, doc: doc})
	}

	dupPaths := map[string]bool{}
	for slug, paths := range slugPaths {
		if len(paths) < 2 {
			continue
		}
		msg := fmt.Sprintf("slug %q は %s でも使われています", slug, strings.Join(paths[1:], "、"))
		for _, path := range paths {
			dupPaths[path] = true
			report.Failed++
			report.Errors = append(report.Errors, fmt.Errorf("%s: %s", path, msg))
		}
	}

	localSlugs := map[string]bool{}
	for _, item := range ready {
		if dupPaths[item.path] {
			continue
		}
		slug, err := content.ParseSlug(item.doc.Slug)
		if err != nil {
			report.Failed++
			report.Errors = append(report.Errors, fmt.Errorf("%s: %w", item.path, err))
			continue
		}
		wantRel := content.PostPath(postsDir, slug)
		wantPath := filepath.Join(opt.Root, filepath.FromSlash(wantRel))
		if filepath.Clean(item.path) != filepath.Clean(wantPath) {
			report.Failed++
			report.Errors = append(report.Errors, fmt.Errorf("%s: slug %q のファイルは %s である必要があります", item.path, item.doc.Slug, wantRel))
			continue
		}
		if err := upsertOne(ctx, pub, item.path, item.doc, opt.DryRun); err != nil {
			report.Failed++
			report.Errors = append(report.Errors, err)
			continue
		}
		report.OK++
		localSlugs[item.doc.Slug] = true
	}

	if opt.Prune {
		report = runPrune(ctx, pub, opt, report, localSlugs)
	}
	return report
}

func runPrune(ctx context.Context, pub Publisher, opt Options, report Report, localSlugs map[string]bool) Report {
	if pub.Client == nil {
		report.Failed++
		report.Errors = append(report.Errors, fmt.Errorf("prune: d1 client is not configured"))
		return report
	}
	remote, err := pub.Client.ListSlugs(ctx)
	if err != nil {
		report.Failed++
		report.Errors = append(report.Errors, fmt.Errorf("prune: %w", err))
		return report
	}
	for _, slug := range remote {
		if localSlugs[slug] {
			continue
		}
		if opt.DryRun {
			if _, err := fmt.Fprintf(pub.Stdout, "--- prune ---\n%s\n\n", slug); err != nil {
				report.Failed++
				report.Errors = append(report.Errors, fmt.Errorf("prune %s: %w", slug, err))
			}
			continue
		}
		if err := pub.Client.DeletePost(ctx, slug); err != nil {
			report.Failed++
			report.Errors = append(report.Errors, fmt.Errorf("prune %s: %w", slug, err))
			continue
		}
		if _, err := fmt.Fprintf(pub.Stdout, "prune -> %s\n", slug); err != nil {
			report.Failed++
			report.Errors = append(report.Errors, fmt.Errorf("prune %s: %w", slug, err))
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

func loadDocument(path string) (markdown.Document, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return markdown.Document{}, fmt.Errorf("%s: %w", path, err)
	}
	doc, err := markdown.Convert(data)
	if err != nil {
		return markdown.Document{}, fmt.Errorf("%s: %w", path, err)
	}
	return doc, nil
}

func upsertOne(ctx context.Context, pub Publisher, path string, doc markdown.Document, dryRun bool) error {
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

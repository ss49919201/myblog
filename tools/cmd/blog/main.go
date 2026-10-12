package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/ss49919201/myblog/tools/internal/content"
	"github.com/ss49919201/myblog/tools/internal/d1client"
	syncposts "github.com/ss49919201/myblog/tools/internal/sync"
)

const (
	exitOK     = 0
	exitFailed = 1
	exitUsage  = 2
)

type command struct {
	name    string
	summary string
	run     func(root string, args []string, stdout, stderr io.Writer) int
}

var commands = []command{
	{"new", "記事の雛形を content/posts/<slug>.md に書きます", runNew},
	{"check", "content/posts の frontmatter を検証します", runCheck},
	{"sync", "content/posts を HTML に変換して D1 の posts に upsert します", runSync},
}

func main() {
	os.Exit(run(findRepoRoot(), os.Args[1:], os.Stdout, os.Stderr))
}

func findRepoRoot() string {
	dir, err := os.Getwd()
	if err != nil {
		return "."
	}
	for {
		if _, err := os.Stat(filepath.Join(dir, "content", "posts")); err == nil {
			if _, err := os.Stat(filepath.Join(dir, "tools", "go.mod")); err == nil {
				return dir
			}
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "."
		}
		dir = parent
	}
}

func run(root string, args []string, stdout, stderr io.Writer) int {
	if len(args) == 0 {
		usage(stderr)
		return exitUsage
	}
	for _, cmd := range commands {
		if args[0] == cmd.name {
			return cmd.run(root, args[1:], stdout, stderr)
		}
	}
	usage(stderr)
	return exitUsage
}

func runNew(root string, args []string, stdout, stderr io.Writer) int {
	fs := flag.NewFlagSet("new", flag.ContinueOnError)
	fs.SetOutput(stderr)
	postsDir := fs.String("posts-dir", content.DefaultPostsDir, "記事ディレクトリ（リポジトリルートからの相対パス）")
	title := fs.String("title", "", "記事のタイトル")
	slugFlag := fs.String("slug", "", "記事のスラッグ")
	publishedAtFlag := fs.String("published-at", "", "公開日時。省略すると現在時刻。2006-01-02、ゾーン無しの時刻、または RFC3339")
	draft := fs.Bool("draft", true, "下書きにする")
	if err := fs.Parse(args); err != nil {
		return exitUsage
	}
	slug, err := content.ParseSlug(*slugFlag)
	if err != nil {
		fmt.Fprintln(stderr, err.Error())
		return exitUsage
	}
	publishedAt := time.Now().Truncate(time.Second)
	if *publishedAtFlag != "" {
		publishedAt, err = content.ParseDate(*publishedAtFlag)
		if err != nil {
			fmt.Fprintln(stderr, err.Error())
			return exitUsage
		}
	}
	path, err := content.Create(root, *postsDir, content.Post{
		Title:       *title,
		Slug:        slug,
		PublishedAt: publishedAt,
		Draft:       *draft,
	})
	if err != nil {
		fmt.Fprintln(stderr, "blog new:", err)
		return exitFailed
	}
	fmt.Fprintln(stdout, path)
	return exitOK
}

func runSync(root string, args []string, stdout, stderr io.Writer) int {
	fs := flag.NewFlagSet("sync", flag.ContinueOnError)
	fs.SetOutput(stderr)
	postsDir := fs.String("posts-dir", content.DefaultPostsDir, "記事ディレクトリ（リポジトリルートからの相対パス）")
	accountID := fs.String("account-id", os.Getenv("CLOUDFLARE_ACCOUNT_ID"), "Cloudflare アカウント ID")
	databaseID := fs.String("database-id", os.Getenv("CLOUDFLARE_D1_DATABASE_ID"), "D1 データベース ID")
	apiToken := fs.String("api-token", os.Getenv("CLOUDFLARE_API_TOKEN"), "Cloudflare API トークン")
	dryRun := fs.Bool("dry-run", false, "HTML と SQL を表示するだけで D1 には書き込まない")
	prune := fs.Bool("prune", false, "ディレクトリに無い slug を D1 から削除する")
	if err := fs.Parse(args); err != nil {
		return exitUsage
	}
	if len(fs.Args()) != 0 {
		fmt.Fprintln(stderr, "blog sync は引数を取りません")
		return exitUsage
	}
	needCreds := !*dryRun || *prune
	if needCreds {
		if *accountID == "" || *databaseID == "" || *apiToken == "" {
			fmt.Fprintln(stderr, "blog sync: --account-id、--database-id、--api-token（または同名の環境変数）が必要です")
			return exitUsage
		}
	}
	pub := syncposts.Publisher{Stdout: stdout}
	if needCreds {
		pub.Client = d1client.New(*apiToken, *accountID, *databaseID)
	}
	report := syncposts.SyncPosts(context.Background(), pub, syncposts.Options{
		Root:     root,
		PostsDir: *postsDir,
		DryRun:   *dryRun,
		Prune:    *prune,
	})
	if err := syncposts.FormatSummary(stderr, report); err != nil {
		fmt.Fprintln(stderr, "blog sync:", err)
		return exitFailed
	}
	if report.Failed > 0 {
		return exitFailed
	}
	return exitOK
}

func runCheck(root string, args []string, stdout, stderr io.Writer) int {
	fs := flag.NewFlagSet("check", flag.ContinueOnError)
	fs.SetOutput(stderr)
	postsDir := fs.String("posts-dir", content.DefaultPostsDir, "記事ディレクトリ（リポジトリルートからの相対パス）")
	if err := fs.Parse(args); err != nil {
		return exitUsage
	}
	if len(fs.Args()) != 0 {
		fmt.Fprintln(stderr, "blog check は位置引数を取りません")
		return exitUsage
	}
	problems, err := content.Check(root, *postsDir)
	if err != nil {
		fmt.Fprintln(stderr, "blog check:", err)
		return exitFailed
	}
	for _, p := range problems {
		fmt.Fprintln(stdout, p)
	}
	if len(problems) > 0 {
		return exitFailed
	}
	return exitOK
}

func usage(w io.Writer) {
	fmt.Fprintln(w, "使い方: blog <command> [flags]")
	for _, cmd := range commands {
		fmt.Fprintf(w, "  %s  %s\n", cmd.name, cmd.summary)
	}
	fmt.Fprintln(w, "リポジトリのルートで実行してください。")
}

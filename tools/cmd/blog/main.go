package main

import (
	"context"
	"flag"
	"fmt"
	"io"
	"os"
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
	{"new", "記事の雛形を src/content/posts/<slug>.md に書きます", runNew},
	{"check", "記事の frontmatter を検証します", runCheck},
	{"sync", "Markdown を HTML に変換して D1 の posts に upsert します", runSync},
}

func main() {
	os.Exit(run(".", os.Args[1:], os.Stdout, os.Stderr))
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
	title := fs.String("title", "", "記事のタイトル")
	slugFlag := fs.String("slug", "", "記事のスラッグ")
	categoryFlag := fs.String("category", "", "カテゴリ id（省略可）")
	dateFlag := fs.String("date", "", "公開日時。省略すると現在時刻。2006-01-02、ゾーン無しの時刻、または RFC3339")
	draft := fs.Bool("draft", true, "下書きにする")
	if err := fs.Parse(args); err != nil {
		return exitUsage
	}
	slug, err := content.ParseSlug(*slugFlag)
	if err != nil {
		fmt.Fprintln(stderr, err.Error())
		return exitUsage
	}
	var category content.Slug
	if *categoryFlag != "" {
		category, err = content.ParseSlug(*categoryFlag)
		if err != nil {
			fmt.Fprintln(stderr, err.Error())
			return exitUsage
		}
	}
	date := time.Now().Truncate(time.Second)
	if *dateFlag != "" {
		date, err = content.ParseDate(*dateFlag)
		if err != nil {
			fmt.Fprintln(stderr, err.Error())
			return exitUsage
		}
	}
	path, err := content.Create(root, content.Post{
		Title:    *title,
		Slug:     slug,
		Date:     date,
		Category: category,
		Draft:    *draft,
	})
	if err != nil {
		fmt.Fprintln(stderr, "blog new:", err)
		return exitFailed
	}
	fmt.Fprintln(stdout, path)
	return exitOK
}

func runSync(_ string, args []string, stdout, stderr io.Writer) int {
	fs := flag.NewFlagSet("sync", flag.ContinueOnError)
	fs.SetOutput(stderr)
	accountID := fs.String("account-id", os.Getenv("CLOUDFLARE_ACCOUNT_ID"), "Cloudflare アカウント ID")
	databaseID := fs.String("database-id", os.Getenv("CLOUDFLARE_D1_DATABASE_ID"), "D1 データベース ID")
	apiToken := fs.String("api-token", os.Getenv("CLOUDFLARE_API_TOKEN"), "Cloudflare API トークン")
	dryRun := fs.Bool("dry-run", false, "HTML と SQL を表示するだけで D1 には書き込まない")
	if err := fs.Parse(args); err != nil {
		return exitUsage
	}
	paths := fs.Args()
	if len(paths) == 0 {
		fmt.Fprintln(stderr, "blog sync は Markdown ファイルを1つ以上指定してください")
		return exitUsage
	}
	if !*dryRun {
		if *accountID == "" || *databaseID == "" || *apiToken == "" {
			fmt.Fprintln(stderr, "blog sync: --account-id、--database-id、--api-token（または同名の環境変数）が必要です")
			return exitUsage
		}
	}
	pub := syncposts.Publisher{Stdout: stdout}
	if !*dryRun {
		pub.Client = d1client.New(*apiToken, *accountID, *databaseID)
	}
	if err := syncposts.PublishFiles(context.Background(), pub, paths, *dryRun); err != nil {
		fmt.Fprintln(stderr, "blog sync:", err)
		return exitFailed
	}
	return exitOK
}

func runCheck(root string, args []string, stdout, stderr io.Writer) int {
	if len(args) != 0 {
		fmt.Fprintln(stderr, "blog check は引数を取りません")
		return exitUsage
	}
	problems, err := content.Check(root)
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

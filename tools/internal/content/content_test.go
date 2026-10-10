package content

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestParseSlug(t *testing.T) {
	slug, err := ParseSlug("日記")
	if err != nil {
		t.Fatal(err)
	}
	if slug.String() != "日記" {
		t.Fatalf("got %q", slug.String())
	}

	for _, in := range []string{"", ".", "..", "a/b", `a\b`, "a\x00b"} {
		_, err := ParseSlug(in)
		want := fmt.Sprintf("%q はスラッグではありません。空文字、.、..、/、\\、NUL は使えません", in)
		if err == nil || err.Error() != want {
			t.Fatalf("ParseSlug(%q)\n got %v\nwant %q", in, err, want)
		}
	}
}

func TestParseDate(t *testing.T) {
	cases := []struct {
		in   string
		want string
		err  string
	}{
		{in: "2026-10-03", want: "2026-10-03T00:00:00Z"},
		{in: "2026-10-03T09:00:00", want: "2026-10-03T09:00:00Z"},
		{in: "2026-10-03T09:00:00.5", want: "2026-10-03T09:00:00.5Z"},
		{in: "2026-10-10T09:00:00+09:00", want: "2026-10-10T09:00:00+09:00"},
		{in: "2026-10-03T00:00:00Z", want: "2026-10-03T00:00:00Z"},
		{in: "2026-10-03T00:00:00.000Z", want: "2026-10-03T00:00:00Z"},
		{
			in:  "2026",
			err: `日付 "2026" は解釈できません。2006-01-02、ゾーン無しの 2006-01-02T15:04:05（UTC）、または Z か数値オフセット付きの RFC3339 にしてください`,
		},
		{
			in:  "October 3, 2026",
			err: `日付 "October 3, 2026" は解釈できません。2006-01-02、ゾーン無しの 2006-01-02T15:04:05（UTC）、または Z か数値オフセット付きの RFC3339 にしてください`,
		},
	}
	for _, tc := range cases {
		got, err := ParseDate(tc.in)
		if tc.err != "" {
			if err == nil || err.Error() != tc.err {
				t.Fatalf("ParseDate(%q) err %v, want %q", tc.in, err, tc.err)
			}
			continue
		}
		if err != nil {
			t.Fatalf("ParseDate(%q): %v", tc.in, err)
		}
		if got.Format(time.RFC3339Nano) != tc.want {
			t.Fatalf("ParseDate(%q) = %s, want %s", tc.in, got.Format(time.RFC3339Nano), tc.want)
		}
	}
}

func TestRenderRoundTrip(t *testing.T) {
	date, err := ParseDate("2026-10-09T07:09:00+09:00")
	if err != nil {
		t.Fatal(err)
	}
	hello, err := ParseSlug("hello-world")
	if err != nil {
		t.Fatal(err)
	}
	news, err := ParseSlug("news")
	if err != nil {
		t.Fatal(err)
	}
	diary, err := ParseSlug("日記")
	if err != nil {
		t.Fatal(err)
	}
	cases := []struct {
		name string
		post Post
		want string
	}{
		{
			name: "scaffold",
			post: Post{Title: "Hello, world", Slug: hello, Date: date, Draft: true},
			want: "---\ntitle: Hello, world\nslug: hello-world\ndate: 2026-10-09T07:09:00+09:00\ndraft: true\n---\n",
		},
		{
			name: "empty title",
			post: Post{Title: "", Slug: hello, Date: date, Draft: true},
			want: "---\ntitle: \"\"\nslug: hello-world\ndate: 2026-10-09T07:09:00+09:00\ndraft: true\n---\n",
		},
		{
			name: "quoted true",
			post: Post{Title: "true", Slug: hello, Date: date, Draft: false, Category: news, Body: "本文\n"},
			want: "---\ntitle: \"true\"\nslug: hello-world\ndate: 2026-10-09T07:09:00+09:00\ncategory: news\ndraft: false\n---\n本文\n",
		},
		{
			name: "japanese slug",
			post: Post{Title: "公開", Slug: diary, Date: date, Draft: true},
			want: "---\ntitle: 公開\nslug: 日記\ndate: 2026-10-09T07:09:00+09:00\ndraft: true\n---\n",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := renderPost(tc.post)
			if string(got) != tc.want {
				t.Fatalf("bytes\n got %q\nwant %q", got, tc.want)
			}
			parsed, probs := parsePost("src/content/posts/"+tc.post.Slug.String()+".md", got)
			if len(probs) != 0 {
				t.Fatal(probs)
			}
			if parsed.Title != tc.post.Title || parsed.Slug != tc.post.Slug || parsed.Category != tc.post.Category || parsed.Draft != tc.post.Draft || parsed.Body != tc.post.Body {
				t.Fatalf("parsed %+v", parsed)
			}
			if !parsed.Date.Equal(tc.post.Date) {
				t.Fatalf("date %s != %s", parsed.Date, tc.post.Date)
			}
			_, offA := tc.post.Date.Zone()
			_, offB := parsed.Date.Zone()
			if offA != offB {
				t.Fatalf("offset %d != %d", offA, offB)
			}
		})
	}
}

// Go cannot derive postFields from the TypeScript schema, so this test fails
// the build when the key names, order, or required-ness disagree.
func TestPostFieldsMatchContentConfig(t *testing.T) {
	configPath := filepath.Join("..", "..", "src", "content.config.ts")
	src, err := os.ReadFile(configPath)
	if errors.Is(err, os.ErrNotExist) {
		t.Skip("src/content.config.ts がありません。記事は apps/web の D1 を参照してください")
	}
	if err != nil {
		t.Fatal(err)
	}
	text := string(src)
	start := strings.Index(text, "const posts")
	if start < 0 {
		t.Fatal("const posts not found")
	}
	rest := text[start:]
	obj := strings.Index(rest, "z.object({")
	if obj < 0 {
		t.Fatal("posts z.object not found")
	}
	rest = rest[obj+len("z.object({"):]
	end := strings.Index(rest, "})")
	if end < 0 {
		t.Fatal("posts z.object end not found")
	}
	var names []string
	var required []bool
	for _, line := range strings.Split(rest[:end], "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "//") {
			continue
		}
		colon := strings.Index(line, ":")
		if colon < 0 {
			t.Fatalf("unparsed schema line %q", line)
		}
		name := strings.TrimSpace(line[:colon])
		expr := strings.TrimSpace(strings.TrimSuffix(strings.TrimSpace(line[colon+1:]), ","))
		names = append(names, name)
		required = append(required, !strings.Contains(expr, ".optional()") && !strings.Contains(expr, ".default("))
	}
	if len(names) != len(postFields) {
		t.Fatalf("config keys %v, postFields has %d", names, len(postFields))
	}
	for i, f := range postFields {
		if names[i] != f.key || required[i] != f.required {
			t.Fatalf("field %d: config %s required=%v, postFields %s required=%v", i, names[i], required[i], f.key, f.required)
		}
	}
}

func newTree(t *testing.T, files map[string]string) string {
	t.Helper()
	root := t.TempDir()
	writeFile(t, root, "src/content.config.ts", "export {}\n")
	writeFile(t, root, "src/content/categories/news.md", "---\nname: お知らせ\n---\n")
	for path, body := range files {
		writeFile(t, root, path, body)
	}
	return root
}

func writeFile(t *testing.T, root, path, body string) {
	t.Helper()
	full := filepath.Join(root, filepath.FromSlash(path))
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(full, []byte(body), 0o644); err != nil {
		t.Fatal(err)
	}
}

func problemLines(t *testing.T, root string) []string {
	t.Helper()
	probs, err := Check(root)
	if err != nil {
		t.Fatal(err)
	}
	lines := make([]string, len(probs))
	for i, p := range probs {
		lines[i] = p.String()
	}
	return lines
}

func assertProblems(t *testing.T, root string, want []string) {
	t.Helper()
	got := problemLines(t, root)
	if len(got) == 0 && len(want) == 0 {
		return
	}
	if strings.Join(got, "\n") != strings.Join(want, "\n") {
		t.Fatalf("problems\n got %q\nwant %q", got, want)
	}
}

func TestCheckFrontmatter(t *testing.T) {
	const hello = "src/content/posts/hello.md"
	const bad = "src/content/posts/bad.md"
	cases := []struct {
		name string
		path string
		body string
		want []string
	}{
		{
			name: "title int",
			path: hello,
			body: "---\ntitle: 2024\nslug: hello\ndate: 2026-10-03T00:00:00Z\n---\n",
			want: []string{`src/content/posts/hello.md: title: 文字列が必要です。"2024"（!!int）でした`},
		},
		{
			name: "title null",
			path: hello,
			body: "---\ntitle:\nslug: hello\ndate: 2026-10-03T00:00:00Z\n---\n",
			want: []string{`src/content/posts/hello.md: title: 文字列が必要です。""（!!null）でした`},
		},
		{
			name: "title empty",
			path: hello,
			body: "---\ntitle: \"\"\nslug: hello\ndate: 2026-10-03T00:00:00Z\n---\n",
		},
		{
			name: "title bool",
			path: hello,
			body: "---\ntitle: true\nslug: hello\ndate: 2026-10-03T00:00:00Z\n---\n",
			want: []string{`src/content/posts/hello.md: title: 文字列が必要です。"true"（!!bool）でした`},
		},
		{
			name: "title quoted true",
			path: hello,
			body: "---\ntitle: \"true\"\nslug: hello\ndate: 2026-10-03T00:00:00Z\n---\n",
		},
		{
			name: "draft yes",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\ndate: 2026-10-03T00:00:00Z\ndraft: yes\n---\n",
			want: []string{`src/content/posts/hello.md: draft: 真偽値が必要です。"yes"（!!str）でした`},
		},
		{
			name: "draft quoted true",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\ndate: 2026-10-03T00:00:00Z\ndraft: \"true\"\n---\n",
			want: []string{`src/content/posts/hello.md: draft: 真偽値が必要です。"true"（!!str）でした`},
		},
		{
			name: "draft TRUE",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\ndate: 2026-10-03T00:00:00Z\ndraft: TRUE\n---\n",
		},
		{
			name: "category null",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\ndate: 2026-10-03T00:00:00Z\ncategory:\n---\n",
			want: []string{`src/content/posts/hello.md: category: 文字列が必要です。""（!!null）でした`},
		},
		{
			name: "date only",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\ndate: 2026-10-03\n---\n",
		},
		{
			name: "date offsetless",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\ndate: 2026-10-03T09:00:00\n---\n",
		},
		{
			name: "date quoted",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\ndate: \"2026-10-03T00:00:00Z\"\n---\n",
		},
		{
			name: "date int",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\ndate: 2026\n---\n",
			want: []string{`src/content/posts/hello.md: date: 日付が必要です。"2026"（!!int）でした`},
		},
		{
			name: "date prose",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\ndate: October 3, 2026\n---\n",
			want: []string{`src/content/posts/hello.md: date: 日付 "October 3, 2026" は解釈できません。2006-01-02、ゾーン無しの 2006-01-02T15:04:05（UTC）、または Z か数値オフセット付きの RFC3339 にしてください`},
		},
		{
			name: "unknown key",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\ndate: 2026-10-03T00:00:00Z\ncatgory: news\n---\n",
			want: []string{`src/content/posts/hello.md: 不明なキー "catgory" です。記事のキーは title、slug、date、category、draft です`},
		},
		{
			name: "duplicate key",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\nslug: world\ndate: 2026-10-03T00:00:00Z\n---\n",
			want: []string{`src/content/posts/hello.md: キー "slug" が2回以上あります`},
		},
		{
			name: "slug dots",
			path: bad,
			body: "---\ntitle: Hello\nslug: ..\ndate: 2026-10-03T00:00:00Z\n---\n",
			want: []string{`src/content/posts/bad.md: slug: ".." はスラッグではありません。空文字、.、..、/、\、NUL は使えません`},
		},
		{
			name: "no frontmatter",
			path: hello,
			body: "hello\n",
			want: []string{"src/content/posts/hello.md: YAML の frontmatter がありません。ファイルは --- の行で始め、もう一つの --- で閉じてください"},
		},
		{
			name: "toml",
			path: hello,
			body: "+++\ntitle = \"Hello\"\n+++\n",
			want: []string{"src/content/posts/hello.md: YAML の frontmatter がありません。ファイルは --- の行で始め、もう一つの --- で閉じてください"},
		},
		{
			name: "empty block",
			path: "src/content/posts/empty.md",
			body: "---\n---\n",
			want: []string{
				`src/content/posts/empty.md: 必須のキー "date" がありません`,
				`src/content/posts/empty.md: 必須のキー "slug" がありません`,
				`src/content/posts/empty.md: 必須のキー "title" がありません`,
			},
		},
		{
			name: "invalid yaml",
			path: bad,
			body: "---\n:\n---\n",
			want: []string{"src/content/posts/bad.md: frontmatter の YAML が正しくありません: yaml: did not find expected key"},
		},
		{
			name: "list",
			path: bad,
			body: "---\n- a\n---\n",
			want: []string{"src/content/posts/bad.md: frontmatter はキーと値の対応である必要があります"},
		},
		{
			name: "japanese slug",
			path: "src/content/posts/日記.md",
			body: "---\ntitle: 公開\nslug: 日記\ndate: 2026-10-03\n---\n",
		},
		{
			name: "future date",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\ndate: 2099-01-01\n---\n",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			root := newTree(t, map[string]string{tc.path: tc.body})
			assertProblems(t, root, tc.want)
		})
	}
}

func TestCheckSiteRules(t *testing.T) {
	t.Run("nested", func(t *testing.T) {
		root := newTree(t, map[string]string{
			"src/content/posts/nested/hello.md": "---\ntitle: Hello\nslug: hello\ndate: 2026-10-03T00:00:00Z\n---\n",
		})
		assertProblems(t, root, []string{
			`src/content/posts/nested/hello.md: slug "hello" のファイルは src/content/posts/hello.md である必要があります`,
		})
	})
	t.Run("duplicate draft", func(t *testing.T) {
		root := newTree(t, map[string]string{
			"src/content/posts/draft-hello.md": "---\ntitle: Old\nslug: hello\ndate: 2026-10-03T00:00:00Z\ndraft: true\n---\n",
			"src/content/posts/hello.md":       "---\ntitle: New\nslug: hello\ndate: 2026-10-03T00:00:00Z\ndraft: false\n---\n",
		})
		assertProblems(t, root, []string{
			`src/content/posts/draft-hello.md: slug "hello" のファイルは src/content/posts/hello.md である必要があります`,
			`src/content/posts/draft-hello.md: slug "hello" は src/content/posts/hello.md でも使われています`,
			`src/content/posts/hello.md: slug "hello" は src/content/posts/draft-hello.md でも使われています`,
		})
	})
	t.Run("missing category", func(t *testing.T) {
		root := newTree(t, map[string]string{
			"src/content/posts/hello.md": "---\ntitle: Hello\nslug: hello\ndate: 2026-10-03T00:00:00Z\ncategory: tech\n---\n",
		})
		assertProblems(t, root, []string{
			`src/content/posts/hello.md: カテゴリ "tech" のファイル src/content/categories/tech.md がありません`,
		})
	})
	t.Run("nested category", func(t *testing.T) {
		root := newTree(t, map[string]string{
			"src/content/categories/a/b.md": "---\nname: nested\n---\n",
		})
		assertProblems(t, root, []string{
			"src/content/categories/a/b.md: カテゴリファイルは src/content/categories/<id>.md で、id は1つのパス要素である必要があります",
		})
	})
	t.Run("zero posts", func(t *testing.T) {
		assertProblems(t, newTree(t, nil), nil)
	})
	t.Run("uppercase category", func(t *testing.T) {
		root := newTree(t, map[string]string{
			"src/content/categories/News.md": "not frontmatter\n",
			"src/content/posts/note.md":      "---\ntitle: Note\nslug: note\ndate: 2026-10-03\ncategory: News\n---\n",
		})
		assertProblems(t, root, nil)
	})
	t.Run("dotfile skipped", func(t *testing.T) {
		root := newTree(t, map[string]string{
			"src/content/posts/.hidden.md": "---\ndraft: yes\n---\n",
		})
		assertProblems(t, root, nil)
	})
}

func TestCheckRepo(t *testing.T) {
	root, err := filepath.Abs(filepath.Join("..", ".."))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(root, "src", "content.config.ts")); errors.Is(err, os.ErrNotExist) {
		t.Skip("src/content.config.ts がありません。記事は apps/web の D1 を参照してください")
	}
	probs, err := Check(root)
	if err != nil {
		t.Fatal(err)
	}
	if len(probs) != 0 {
		t.Fatalf("%v", probs)
	}
}

func TestCheckNeedsCheckout(t *testing.T) {
	_, err := Check(t.TempDir())
	const want = "src/content.config.ts が見つかりません。blog はリポジトリのルートで実行してください"
	if err == nil || err.Error() != want {
		t.Fatalf("got %v", err)
	}
}

func fixedDate(t *testing.T) time.Time {
	t.Helper()
	date, err := ParseDate("2026-10-09T07:09:00+09:00")
	if err != nil {
		t.Fatal(err)
	}
	return date
}

func mustSlug(t *testing.T, s string) Slug {
	t.Helper()
	slug, err := ParseSlug(s)
	if err != nil {
		t.Fatal(err)
	}
	return slug
}

func TestCreateWritesScaffold(t *testing.T) {
	root := newTree(t, nil)
	path, err := Create(root, Post{
		Title: "Hello, world",
		Slug:  mustSlug(t, "hello-world"),
		Date:  fixedDate(t),
		Draft: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	if path != "src/content/posts/hello-world.md" {
		t.Fatalf("path %s", path)
	}
	got := readFile(t, root, path)
	const want = "---\ntitle: Hello, world\nslug: hello-world\ndate: 2026-10-09T07:09:00+09:00\ndraft: true\n---\n"
	if got != want {
		t.Fatalf("bytes\n got %q\nwant %q", got, want)
	}
	assertProblems(t, root, nil)

	emptyRoot := newTree(t, nil)
	emptyPath, err := Create(emptyRoot, Post{
		Title: "",
		Slug:  mustSlug(t, "hello-world"),
		Date:  fixedDate(t),
		Draft: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	const emptyWant = "---\ntitle: \"\"\nslug: hello-world\ndate: 2026-10-09T07:09:00+09:00\ndraft: true\n---\n"
	if readFile(t, emptyRoot, emptyPath) != emptyWant {
		t.Fatalf("empty title bytes %q", readFile(t, emptyRoot, emptyPath))
	}
	assertProblems(t, emptyRoot, nil)
}

func TestCreateJapaneseSlug(t *testing.T) {
	root := newTree(t, nil)
	path, err := Create(root, Post{
		Title: "公開",
		Slug:  mustSlug(t, "日記"),
		Date:  fixedDate(t),
		Draft: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	if path != "src/content/posts/日記.md" {
		t.Fatalf("path %s", path)
	}
	const want = "---\ntitle: 公開\nslug: 日記\ndate: 2026-10-09T07:09:00+09:00\ndraft: true\n---\n"
	first := readFile(t, root, path)
	if first != want {
		t.Fatalf("bytes\n got %q\nwant %q", first, want)
	}
	_, err = Create(root, Post{
		Title: "別のタイトル",
		Slug:  mustSlug(t, "日記"),
		Date:  fixedDate(t),
		Draft: false,
	})
	const exists = "src/content/posts/日記.md は既にあります"
	if err == nil || err.Error() != exists {
		t.Fatalf("got %v", err)
	}
	if readFile(t, root, path) != first {
		t.Fatal("second create changed the file")
	}
}

func TestCreateRefuses(t *testing.T) {
	t.Run("duplicate draft", func(t *testing.T) {
		const existing = "src/content/posts/2026/hello.md"
		body := "---\ntitle: Old\nslug: hello\ndate: 2026-10-01T00:00:00Z\ndraft: true\n---\n"
		root := newTree(t, map[string]string{existing: body})
		_, err := Create(root, Post{Title: "New", Slug: mustSlug(t, "hello"), Date: fixedDate(t), Draft: true})
		const want = "src/content/posts/hello.md の作成を拒否します:\n  src/content/posts/hello.md: slug \"hello\" は src/content/posts/2026/hello.md でも使われています"
		if err == nil || err.Error() != want {
			t.Fatalf("got %v\nwant %s", err, want)
		}
		if readFile(t, root, existing) != body {
			t.Fatal("existing file changed")
		}
		if _, statErr := os.Stat(filepath.Join(root, "src", "content", "posts", "hello.md")); !os.IsNotExist(statErr) {
			t.Fatal("created the refused file")
		}
	})
	t.Run("missing category", func(t *testing.T) {
		root := newTree(t, nil)
		_, err := Create(root, Post{
			Title:    "Hi",
			Slug:     mustSlug(t, "hi"),
			Date:     fixedDate(t),
			Category: mustSlug(t, "tech"),
			Draft:    true,
		})
		const want = "src/content/posts/hi.md の作成を拒否します:\n  src/content/posts/hi.md: カテゴリ \"tech\" のファイル src/content/categories/tech.md がありません"
		if err == nil || err.Error() != want {
			t.Fatalf("got %v\nwant %s", err, want)
		}
		if _, statErr := os.Stat(filepath.Join(root, "src", "content", "posts", "hi.md")); !os.IsNotExist(statErr) {
			t.Fatal("created the refused file")
		}
	})
	t.Run("existing file", func(t *testing.T) {
		root := newTree(t, nil)
		post := Post{Title: "Hello, world", Slug: mustSlug(t, "hello-world"), Date: fixedDate(t), Draft: true}
		path, err := Create(root, post)
		if err != nil {
			t.Fatal(err)
		}
		first := readFile(t, root, path)
		post.Title = "Changed"
		_, err = Create(root, post)
		const want = "src/content/posts/hello-world.md は既にあります"
		if err == nil || err.Error() != want {
			t.Fatalf("got %v", err)
		}
		if readFile(t, root, path) != first {
			t.Fatal("second create changed the file")
		}
	})
	t.Run("zero slug", func(t *testing.T) {
		root := newTree(t, nil)
		_, err := Create(root, Post{Title: "x", Date: fixedDate(t), Draft: true})
		const want = "src/content/posts/.md の作成を拒否します:\n  src/content/posts/.md: slug: \"\" はスラッグではありません。空文字、.、..、/、\\、NUL は使えません"
		if err == nil || err.Error() != want {
			t.Fatalf("got %v\nwant %s", err, want)
		}
	})
	t.Run("other files do not block", func(t *testing.T) {
		const broken = "src/content/posts/bad.md"
		body := "---\ntitle: Bad\nslug: bad\ndate: 2026-10-03T00:00:00Z\ncategory: missing\n---\n"
		root := newTree(t, map[string]string{broken: body})
		path, err := Create(root, Post{
			Title:    "Hello",
			Slug:     mustSlug(t, "hello"),
			Date:     fixedDate(t),
			Category: mustSlug(t, "news"),
			Draft:    true,
		})
		if err != nil {
			t.Fatal(err)
		}
		if path != "src/content/posts/hello.md" {
			t.Fatalf("path %s", path)
		}
		if readFile(t, root, broken) != body {
			t.Fatal("other file changed")
		}
		assertProblems(t, root, []string{
			`src/content/posts/bad.md: カテゴリ "missing" のファイル src/content/categories/missing.md がありません`,
		})
	})
}

func readFile(t *testing.T, root, path string) string {
	t.Helper()
	b, err := os.ReadFile(filepath.Join(root, filepath.FromSlash(path)))
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}

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
			post: Post{Title: "Hello, world", Slug: hello, PublishedAt: date, Draft: true},
			want: "---\ntitle: Hello, world\nslug: hello-world\npublished_at: 2026-10-09T07:09:00+09:00\ndraft: true\n---\n",
		},
		{
			name: "empty title",
			post: Post{Title: "", Slug: hello, PublishedAt: date, Draft: true},
			want: "---\ntitle: \"\"\nslug: hello-world\npublished_at: 2026-10-09T07:09:00+09:00\ndraft: true\n---\n",
		},
		{
			name: "quoted true",
			post: Post{Title: "true", Slug: hello, PublishedAt: date, Draft: false, Body: "本文\n"},
			want: "---\ntitle: \"true\"\nslug: hello-world\npublished_at: 2026-10-09T07:09:00+09:00\ndraft: false\n---\n本文\n",
		},
		{
			name: "japanese slug",
			post: Post{Title: "公開", Slug: diary, PublishedAt: date, Draft: true},
			want: "---\ntitle: 公開\nslug: 日記\npublished_at: 2026-10-09T07:09:00+09:00\ndraft: true\n---\n",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := renderPost(tc.post)
			if string(got) != tc.want {
				t.Fatalf("bytes\n got %q\nwant %q", got, tc.want)
			}
			parsed, probs := parsePost("content/posts/"+tc.post.Slug.String()+".md", got)
			if len(probs) != 0 {
				t.Fatal(probs)
			}
			if parsed.Title != tc.post.Title || parsed.Slug != tc.post.Slug || parsed.Draft != tc.post.Draft || parsed.Body != tc.post.Body {
				t.Fatalf("parsed %+v", parsed)
			}
			if !parsed.PublishedAt.Equal(tc.post.PublishedAt) {
				t.Fatalf("date %s != %s", parsed.PublishedAt, tc.post.PublishedAt)
			}
			_, offA := tc.post.PublishedAt.Zone()
			_, offB := parsed.PublishedAt.Zone()
			if offA != offB {
				t.Fatalf("offset %d != %d", offA, offB)
			}
		})
	}
}

func newTree(t *testing.T, files map[string]string) string {
	t.Helper()
	root := t.TempDir()
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
	probs, err := Check(root, "")
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
	const hello = "content/posts/hello.md"
	const bad = "content/posts/bad.md"
	cases := []struct {
		name string
		path string
		body string
		want []string
	}{
		{
			name: "title int",
			path: hello,
			body: "---\ntitle: 2024\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\n---\n",
			want: []string{`content/posts/hello.md: title: 文字列が必要です。"2024"（!!int）でした`},
		},
		{
			name: "title null",
			path: hello,
			body: "---\ntitle:\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\n---\n",
			want: []string{`content/posts/hello.md: title: 文字列が必要です。""（!!null）でした`},
		},
		{
			name: "title empty",
			path: hello,
			body: "---\ntitle: \"\"\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\n---\n",
		},
		{
			name: "title bool",
			path: hello,
			body: "---\ntitle: true\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\n---\n",
			want: []string{`content/posts/hello.md: title: 文字列が必要です。"true"（!!bool）でした`},
		},
		{
			name: "title quoted true",
			path: hello,
			body: "---\ntitle: \"true\"\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\n---\n",
		},
		{
			name: "draft yes",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\ndraft: yes\n---\n",
			want: []string{`content/posts/hello.md: draft: 真偽値が必要です。"yes"（!!str）でした`},
		},
		{
			name: "draft quoted true",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\ndraft: \"true\"\n---\n",
			want: []string{`content/posts/hello.md: draft: 真偽値が必要です。"true"（!!str）でした`},
		},
		{
			name: "draft TRUE",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\ndraft: TRUE\n---\n",
		},
		{
			name: "category null",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\ncategory:\n---\n",
			want: []string{`content/posts/hello.md: 不明なキー "category" です。記事のキーは title、slug、published_at、draft です`},
		},
		{
			name: "published_at only",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\npublished_at: 2026-10-03\n---\n",
		},
		{
			name: "published_at offsetless",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\npublished_at: 2026-10-03T09:00:00\n---\n",
		},
		{
			name: "published_at quoted",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\npublished_at: \"2026-10-03T00:00:00Z\"\n---\n",
		},
		{
			name: "published_at int",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\npublished_at: 2026\n---\n",
			want: []string{`content/posts/hello.md: published_at: 日付が必要です。"2026"（!!int）でした`},
		},
		{
			name: "published_at prose",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\npublished_at: October 3, 2026\n---\n",
			want: []string{`content/posts/hello.md: published_at: 日付 "October 3, 2026" は解釈できません。2006-01-02、ゾーン無しの 2006-01-02T15:04:05（UTC）、または Z か数値オフセット付きの RFC3339 にしてください`},
		},
		{
			name: "unknown key",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\ncatgory: news\n---\n",
			want: []string{`content/posts/hello.md: 不明なキー "catgory" です。記事のキーは title、slug、published_at、draft です`},
		},
		{
			name: "duplicate key",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\nslug: world\npublished_at: 2026-10-03T00:00:00Z\n---\n",
			want: []string{`content/posts/hello.md: キー "slug" が2回以上あります`},
		},
		{
			name: "slug dots",
			path: bad,
			body: "---\ntitle: Hello\nslug: ..\npublished_at: 2026-10-03T00:00:00Z\n---\n",
			want: []string{`content/posts/bad.md: slug: ".." はスラッグではありません。空文字、.、..、/、\、NUL は使えません`},
		},
		{
			name: "no frontmatter",
			path: hello,
			body: "hello\n",
			want: []string{"content/posts/hello.md: YAML の frontmatter がありません。ファイルは --- の行で始め、もう一つの --- で閉じてください"},
		},
		{
			name: "toml",
			path: hello,
			body: "+++\ntitle = \"Hello\"\n+++\n",
			want: []string{"content/posts/hello.md: YAML の frontmatter がありません。ファイルは --- の行で始め、もう一つの --- で閉じてください"},
		},
		{
			name: "empty block",
			path: "content/posts/empty.md",
			body: "---\n---\n",
			want: []string{
				`content/posts/empty.md: 必須のキー "published_at" がありません`,
				`content/posts/empty.md: 必須のキー "slug" がありません`,
				`content/posts/empty.md: 必須のキー "title" がありません`,
			},
		},
		{
			name: "invalid yaml",
			path: bad,
			body: "---\n:\n---\n",
			want: []string{"content/posts/bad.md: frontmatter の YAML が正しくありません: yaml: did not find expected key"},
		},
		{
			name: "list",
			path: bad,
			body: "---\n- a\n---\n",
			want: []string{"content/posts/bad.md: frontmatter はキーと値の対応である必要があります"},
		},
		{
			name: "japanese slug",
			path: "content/posts/日記.md",
			body: "---\ntitle: 公開\nslug: 日記\npublished_at: 2026-10-03\n---\n",
		},
		{
			name: "future date",
			path: hello,
			body: "---\ntitle: Hello\nslug: hello\npublished_at: 2099-01-01\n---\n",
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
			"content/posts/nested/hello.md": "---\ntitle: Hello\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\n---\n",
		})
		assertProblems(t, root, []string{
			`content/posts/nested/hello.md: slug "hello" のファイルは content/posts/hello.md である必要があります`,
		})
	})
	t.Run("duplicate draft", func(t *testing.T) {
		root := newTree(t, map[string]string{
			"content/posts/draft-hello.md": "---\ntitle: Old\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\ndraft: true\n---\n",
			"content/posts/hello.md":       "---\ntitle: New\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\ndraft: false\n---\n",
		})
		assertProblems(t, root, []string{
			`content/posts/draft-hello.md: slug "hello" のファイルは content/posts/hello.md である必要があります`,
			`content/posts/draft-hello.md: slug "hello" は content/posts/hello.md でも使われています`,
			`content/posts/hello.md: slug "hello" は content/posts/draft-hello.md でも使われています`,
		})
	})
	t.Run("unknown category key", func(t *testing.T) {
		root := newTree(t, map[string]string{
			"content/posts/hello.md": "---\ntitle: Hello\nslug: hello\npublished_at: 2026-10-03T00:00:00Z\ncategory: tech\n---\n",
		})
		assertProblems(t, root, []string{
			`content/posts/hello.md: 不明なキー "category" です。記事のキーは title、slug、published_at、draft です`,
		})
	})
	t.Run("zero posts", func(t *testing.T) {
		assertProblems(t, newTree(t, nil), nil)
	})
	t.Run("dotfile skipped", func(t *testing.T) {
		root := newTree(t, map[string]string{
			"content/posts/.hidden.md": "---\ndraft: yes\n---\n",
		})
		assertProblems(t, root, nil)
	})
}

func TestCheckRepo(t *testing.T) {
	root, err := filepath.Abs(filepath.Join("..", ".."))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(root, "content", "posts")); errors.Is(err, os.ErrNotExist) {
		t.Skip("content/posts がありません")
	}
	probs, err := Check(root, "")
	if err != nil {
		t.Fatal(err)
	}
	if len(probs) != 0 {
		t.Fatalf("%v", probs)
	}
}

func TestCheckEmptyRepo(t *testing.T) {
	probs, err := Check(t.TempDir(), "")
	if err != nil {
		t.Fatal(err)
	}
	if len(probs) != 0 {
		t.Fatalf("%v", probs)
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
	path, err := Create(root, "", Post{
		Title: "Hello, world",
		Slug:  mustSlug(t, "hello-world"),
		PublishedAt:  fixedDate(t),
		Draft: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	if path != "content/posts/hello-world.md" {
		t.Fatalf("path %s", path)
	}
	got := readFile(t, root, path)
	const want = "---\ntitle: Hello, world\nslug: hello-world\npublished_at: 2026-10-09T07:09:00+09:00\ndraft: true\n---\n"
	if got != want {
		t.Fatalf("bytes\n got %q\nwant %q", got, want)
	}
	assertProblems(t, root, nil)

	emptyRoot := newTree(t, nil)
	emptyPath, err := Create(emptyRoot, "", Post{
		Title: "",
		Slug:  mustSlug(t, "hello-world"),
		PublishedAt:  fixedDate(t),
		Draft: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	const emptyWant = "---\ntitle: \"\"\nslug: hello-world\npublished_at: 2026-10-09T07:09:00+09:00\ndraft: true\n---\n"
	if readFile(t, emptyRoot, emptyPath) != emptyWant {
		t.Fatalf("empty title bytes %q", readFile(t, emptyRoot, emptyPath))
	}
	assertProblems(t, emptyRoot, nil)
}

func TestCreateJapaneseSlug(t *testing.T) {
	root := newTree(t, nil)
	path, err := Create(root, "", Post{
		Title: "公開",
		Slug:  mustSlug(t, "日記"),
		PublishedAt:  fixedDate(t),
		Draft: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	if path != "content/posts/日記.md" {
		t.Fatalf("path %s", path)
	}
	const want = "---\ntitle: 公開\nslug: 日記\npublished_at: 2026-10-09T07:09:00+09:00\ndraft: true\n---\n"
	first := readFile(t, root, path)
	if first != want {
		t.Fatalf("bytes\n got %q\nwant %q", first, want)
	}
	_, err = Create(root, "", Post{
		Title: "別のタイトル",
		Slug:  mustSlug(t, "日記"),
		PublishedAt:  fixedDate(t),
		Draft: false,
	})
	const exists = "content/posts/日記.md は既にあります"
	if err == nil || err.Error() != exists {
		t.Fatalf("got %v", err)
	}
	if readFile(t, root, path) != first {
		t.Fatal("second create changed the file")
	}
}

func TestCreateRefuses(t *testing.T) {
	t.Run("duplicate draft", func(t *testing.T) {
		const existing = "content/posts/2026/hello.md"
		body := "---\ntitle: Old\nslug: hello\npublished_at: 2026-10-01T00:00:00Z\ndraft: true\n---\n"
		root := newTree(t, map[string]string{existing: body})
		_, err := Create(root, "", Post{Title: "New", Slug: mustSlug(t, "hello"), PublishedAt: fixedDate(t), Draft: true})
		const want = "content/posts/hello.md の作成を拒否します:\n  content/posts/hello.md: slug \"hello\" は content/posts/2026/hello.md でも使われています"
		if err == nil || err.Error() != want {
			t.Fatalf("got %v\nwant %s", err, want)
		}
		if readFile(t, root, existing) != body {
			t.Fatal("existing file changed")
		}
		if _, statErr := os.Stat(filepath.Join(root, "content", "posts", "hello.md")); !os.IsNotExist(statErr) {
			t.Fatal("created the refused file")
		}
	})
	t.Run("existing file", func(t *testing.T) {
		root := newTree(t, nil)
		post := Post{Title: "Hello, world", Slug: mustSlug(t, "hello-world"), PublishedAt: fixedDate(t), Draft: true}
		path, err := Create(root, "", post)
		if err != nil {
			t.Fatal(err)
		}
		first := readFile(t, root, path)
		post.Title = "Changed"
		_, err = Create(root, "", post)
		const want = "content/posts/hello-world.md は既にあります"
		if err == nil || err.Error() != want {
			t.Fatalf("got %v", err)
		}
		if readFile(t, root, path) != first {
			t.Fatal("second create changed the file")
		}
	})
	t.Run("zero slug", func(t *testing.T) {
		root := newTree(t, nil)
		_, err := Create(root, "", Post{Title: "x", PublishedAt: fixedDate(t), Draft: true})
		const want = "content/posts/.md の作成を拒否します:\n  content/posts/.md: slug: \"\" はスラッグではありません。空文字、.、..、/、\\、NUL は使えません"
		if err == nil || err.Error() != want {
			t.Fatalf("got %v\nwant %s", err, want)
		}
	})
	t.Run("other files do not block", func(t *testing.T) {
		const broken = "content/posts/bad.md"
		body := "---\ntitle: Bad\nslug: bad\npublished_at: 2026-10-03T00:00:00Z\ncategory: missing\n---\n"
		root := newTree(t, map[string]string{broken: body})
		path, err := Create(root, "", Post{
			Title:       "Hello",
			Slug:        mustSlug(t, "hello"),
			PublishedAt: fixedDate(t),
			Draft:       true,
		})
		if err != nil {
			t.Fatal(err)
		}
		if path != "content/posts/hello.md" {
			t.Fatalf("path %s", path)
		}
		if readFile(t, root, broken) != body {
			t.Fatal("other file changed")
		}
		assertProblems(t, root, []string{
			`content/posts/bad.md: 不明なキー "category" です。記事のキーは title、slug、published_at、draft です`,
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

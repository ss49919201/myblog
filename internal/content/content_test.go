package content

import (
	"fmt"
	"os"
	"path/filepath"
	"slices"
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
	src, err := os.ReadFile(filepath.Join("..", "..", "src", "content.config.ts"))
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
	root := t.TempDir()
	if err := os.MkdirAll(filepath.Join(root, "src"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "src", "content.config.ts"), []byte("// marker\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(root, "src", "content", "categories"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll(filepath.Join(root, "src", "content", "posts"), 0o755); err != nil {
		t.Fatal(err)
	}
	for path, body := range files {
		full := filepath.Join(root, filepath.FromSlash(path))
		if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(full, []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	return root
}

func TestCheckEmptyPosts(t *testing.T) {
	root := newTree(t, map[string]string{
		"src/content/categories/news.md": "---\nname: お知らせ\n---\n",
	})
	probs, err := Check(root)
	if err != nil {
		t.Fatal(err)
	}
	if len(probs) != 0 {
		t.Fatal(probs)
	}
}

func TestCheckFrontmatterFailures(t *testing.T) {
	root := newTree(t, map[string]string{
		"src/content/categories/news.md": "---\nname: お知らせ\n---\n",
		"src/content/posts/a.md":       "---\ntitle: t\nslug: a\ndate: 2026-10-03\ndraft: yes\n---\n",
		"src/content/posts/b.md":         "---\ntitle: true\nslug: b\ndate: 2026-10-03\ndraft: false\n---\n",
		"src/content/posts/c.md":         "---\ntitle: \"\"\nslug: c\ndate: 2026-10-03\ndraft: false\n---\n",
		"src/content/posts/d.md":         "---\ntitle: t\nslug: d\ndate: 2026\ndraft: false\n---\n",
		"src/content/posts/e.md":         "---\ntitle: t\nslug: e\ndate: 2026-10-03\ncatgory: news\ndraft: false\n---\n",
	})
	probs, err := Check(root)
	if err != nil {
		t.Fatal(err)
	}
	if len(probs) == 0 {
		t.Fatal("expected problems")
	}
	want := []string{
		"src/content/posts/a.md: draft: 真偽値が必要です。\"yes\"（!!str）でした",
		"src/content/posts/b.md: title: 文字列が必要です。\"true\"（!!bool）でした",
		"src/content/posts/d.md: date: 日付が必要です。\"2026\"（!!int）でした",
		"src/content/posts/e.md: 不明なキー \"catgory\" です。記事のキーは title、slug、date、category、draft です",
	}
	for _, w := range want {
		if !slices.ContainsFunc(probs, func(p Problem) bool { return p.String() == w }) {
			t.Fatalf("missing %q in %v", w, probs)
		}
	}
}

func TestCheckDuplicateSlugAndCategory(t *testing.T) {
	root := newTree(t, map[string]string{
		"src/content/categories/news.md": "---\nname: お知らせ\n---\n",
		"src/content/posts/hello.md":     "---\ntitle: A\nslug: hello\ndate: 2026-10-03T00:00:00Z\ndraft: true\n---\n",
		"src/content/posts/world.md":   "---\ntitle: B\nslug: hello\ndate: 2026-10-03T00:00:00Z\ndraft: false\n---\n",
		"src/content/posts/c.md":         "---\ntitle: C\nslug: c\ndate: 2026-10-03T00:00:00Z\ncategory: tech\ndraft: false\n---\n",
	})
	probs, err := Check(root)
	if err != nil {
		t.Fatal(err)
	}
	dupA := "src/content/posts/hello.md: slug \"hello\" は src/content/posts/world.md でも使われています"
	dupB := "src/content/posts/world.md: slug \"hello\" は src/content/posts/hello.md でも使われています"
	path := "src/content/posts/world.md: slug \"hello\" のファイルは src/content/posts/hello.md である必要があります"
	miss := "src/content/posts/c.md: カテゴリ \"tech\" のファイル src/content/categories/tech.md がありません"
	for _, w := range []string{dupA, dupB, path, miss} {
		if !slices.ContainsFunc(probs, func(p Problem) bool { return p.String() == w }) {
			t.Fatalf("missing %q in %v", w, probs)
		}
	}
}

func TestCreateRefusesDuplicateAndRewrites(t *testing.T) {
	root := newTree(t, map[string]string{
		"src/content/categories/news.md":  "---\nname: お知らせ\n---\n",
		"src/content/posts/2026/hello.md": "---\ntitle: Old\nslug: hello\ndate: 2026-10-01T00:00:00Z\ndraft: true\n---\n",
	})
	slug, _ := ParseSlug("hello")
	date, _ := ParseDate("2026-10-09T07:09:00+09:00")
	_, err := Create(root, Post{Title: "New", Slug: slug, Date: date, Draft: true})
	if err == nil {
		t.Fatal("expected error")
	}
	want := "src/content/posts/hello.md の作成を拒否します:\n  src/content/posts/hello.md: slug \"hello\" は src/content/posts/2026/hello.md でも使われています"
	if err.Error() != want {
		t.Fatalf("got %q want %q", err.Error(), want)
	}
	if err := os.Remove(filepath.Join(root, "src/content/posts/2026/hello.md")); err != nil {
		t.Fatal(err)
	}
	diary, _ := ParseSlug("日記")
	path, err := Create(root, Post{Title: "公開", Slug: diary, Date: date, Draft: true})
	if err != nil {
		t.Fatal(err)
	}
	if path != "src/content/posts/日記.md" {
		t.Fatalf("path %q", path)
	}
	_, err = Create(root, Post{Title: "Again", Slug: diary, Date: date, Draft: true})
	if err == nil {
		t.Fatal("expected exists error")
	}
	if !strings.Contains(err.Error(), "は既にあります") {
		t.Fatal(err)
	}
	after, _ := os.ReadFile(filepath.Join(root, "src/content/posts/日記.md"))
	if !strings.Contains(string(after), "slug: 日記") {
		t.Fatalf("bytes %q", after)
	}
	probs, err := Check(root)
	if err != nil || len(probs) != 0 {
		t.Fatalf("check %v %v", probs, err)
	}
}

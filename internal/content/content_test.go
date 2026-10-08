package content

import (
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

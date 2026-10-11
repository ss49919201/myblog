package markdown

import (
	"testing"
	"time"
)

func TestConvert(t *testing.T) {
	cases := []struct {
		name    string
		source  string
		want    Document
		wantErr string
	}{
		{
			name: "gfm heading and list",
			source: `---
title: Hello
slug: hello
published_at: 2026-10-03T00:00:00Z
---
# Title

- one
- two
`,
			want: Document{
				Title:       "Hello",
				Slug:        "hello",
				PublishedAt: time.Date(2026, 10, 3, 0, 0, 0, 0, time.UTC),
				HTML:        "<h1>Title</h1>\n<ul>\n<li>one</li>\n<li>two</li>\n</ul>",
			},
		},
		{
			name: "strips raw html",
			source: `---
title: Safe
slug: safe
published_at: 2026-10-03
---
<script>alert(1)</script>

**bold**
`,
			want: Document{
				Title:       "Safe",
				Slug:        "safe",
				PublishedAt: time.Date(2026, 10, 3, 0, 0, 0, 0, time.UTC),
				HTML:        "<!-- raw HTML omitted -->\n<p><strong>bold</strong></p>",
			},
		},
		{
			name: "missing frontmatter",
			source: `# only body
`,
			wantErr: "frontmatter がありません",
		},
		{
			name: "missing slug",
			source: `---
title: T
published_at: 2026-10-03
---
`,
			wantErr: `frontmatter に "slug" がありません`,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := Convert([]byte(tc.source))
			if tc.wantErr != "" {
				if err == nil || err.Error() != tc.wantErr {
					t.Fatalf("err %v want %q", err, tc.wantErr)
				}
				return
			}
			if err != nil {
				t.Fatal(err)
			}
			if got.Title != tc.want.Title || got.Slug != tc.want.Slug || got.HTML != tc.want.HTML {
				t.Fatalf("got %+v want %+v", got, tc.want)
			}
			if !got.PublishedAt.Equal(tc.want.PublishedAt) {
				t.Fatalf("published_at %s want %s", got.PublishedAt, tc.want.PublishedAt)
			}
		})
	}
}

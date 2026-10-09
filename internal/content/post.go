package content

import (
	"bytes"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/adrg/frontmatter"
	"go.yaml.in/yaml/v3"
)

// Slug is a post slug or a category id. The zero Slug is not produced by
// ParseSlug. Post.Category uses that zero value to mean the key is omitted.
type Slug struct{ s string }

func ParseSlug(s string) (Slug, error) {
	if s == "" || s == "." || s == ".." || strings.ContainsAny(s, "/\\") || strings.ContainsRune(s, 0) {
		return Slug{}, fmt.Errorf("%q はスラッグではありません。空文字、.、..、/、\\、NUL は使えません", s)
	}
	return Slug{s: s}, nil
}

func (s Slug) String() string { return s.s }

func ParseDate(s string) (time.Time, error) {
	if t, err := time.Parse(time.RFC3339Nano, s); err == nil {
		return t, nil
	}
	if t, err := time.Parse("2006-01-02T15:04:05", s); err == nil {
		return t, nil
	}
	if t, err := time.Parse("2006-01-02", s); err == nil {
		return t, nil
	}
	return time.Time{}, fmt.Errorf("日付 %q は解釈できません。2006-01-02、ゾーン無しの 2006-01-02T15:04:05（UTC）、または Z か数値オフセット付きの RFC3339 にしてください", s)
}

type Post struct {
	Title    string
	Slug     Slug
	Date     time.Time
	Category Slug
	Draft    bool
	Body     string
}

type field struct {
	key      string
	required bool
	decode   func(v *yaml.Node, p *Post) error
	encode   func(p Post) any
}

// Decoders read ShortTag, the YAML 1.2 core-schema tag. Astro resolves
// frontmatter with that schema, so draft: yes is !!str and title: 2024 is !!int.
var postFields = []field{
	{key: "title", required: true, decode: decodeTitle, encode: func(p Post) any { return p.Title }},
	{key: "slug", required: true, decode: decodeSlug, encode: func(p Post) any { return p.Slug.String() }},
	{key: "date", required: true, decode: decodeDate, encode: func(p Post) any { return p.Date }},
	{key: "category", required: false, decode: decodeCategory, encode: encodeCategory},
	{key: "draft", required: false, decode: decodeDraft, encode: func(p Post) any { return p.Draft }},
}

func decodeTitle(v *yaml.Node, p *Post) error {
	if v.ShortTag() != "!!str" {
		return want("文字列", v)
	}
	p.Title = v.Value
	return nil
}

func decodeSlug(v *yaml.Node, p *Post) error {
	if v.ShortTag() != "!!str" {
		return want("文字列", v)
	}
	slug, err := ParseSlug(v.Value)
	if err != nil {
		return err
	}
	p.Slug = slug
	return nil
}

func decodeDate(v *yaml.Node, p *Post) error {
	if v.ShortTag() != "!!timestamp" && v.ShortTag() != "!!str" {
		return want("日付", v)
	}
	t, err := ParseDate(v.Value)
	if err != nil {
		return err
	}
	p.Date = t
	return nil
}

func decodeCategory(v *yaml.Node, p *Post) error {
	if v.ShortTag() != "!!str" {
		return want("文字列", v)
	}
	slug, err := ParseSlug(v.Value)
	if err != nil {
		return err
	}
	p.Category = slug
	return nil
}

func decodeDraft(v *yaml.Node, p *Post) error {
	if v.ShortTag() != "!!bool" {
		return want("真偽値", v)
	}
	var draft bool
	if err := v.Decode(&draft); err != nil {
		return err
	}
	p.Draft = draft
	return nil
}

func encodeCategory(p Post) any {
	if p.Category == (Slug{}) {
		return nil
	}
	return p.Category.String()
}

func want(kind string, v *yaml.Node) error {
	return fmt.Errorf("%sが必要です。%q（%s）でした", kind, v.Value, v.ShortTag())
}

func fieldList() string {
	keys := make([]string, len(postFields))
	for i, f := range postFields {
		keys[i] = f.key
	}
	return strings.Join(keys, "、")
}

func findField(key string) (field, bool) {
	for _, f := range postFields {
		if f.key == key {
			return f, true
		}
	}
	return field{}, false
}

var yamlFrontmatter = frontmatter.NewFormat("---", "---", yaml.Unmarshal)

func parsePost(path string, src []byte) (Post, []Problem) {
	var doc yaml.Node
	body, err := frontmatter.MustParse(bytes.NewReader(src), &doc, yamlFrontmatter)
	if err != nil {
		msg := "frontmatter の YAML が正しくありません: " + err.Error()
		if errors.Is(err, frontmatter.ErrNotFound) {
			msg = "YAML の frontmatter がありません。ファイルは --- の行で始め、もう一つの --- で閉じてください"
		}
		return Post{}, []Problem{{Path: path, Msg: msg}}
	}

	mapping, ok := mappingNode(doc)
	if !ok || mapping.Kind != yaml.MappingNode {
		return Post{}, []Problem{{Path: path, Msg: "frontmatter はキーと値の対応である必要があります"}}
	}
	if len(mapping.Content)%2 != 0 {
		return Post{}, []Problem{{Path: path, Msg: "frontmatter はキーと値の対応である必要があります"}}
	}

	var post Post
	seen := map[string]bool{}
	var problems []Problem
	for i := 0; i < len(mapping.Content); i += 2 {
		k := deref(mapping.Content[i])
		v := deref(mapping.Content[i+1])
		if k.ShortTag() != "!!str" {
			problems = append(problems, Problem{
				Path: path,
				Msg:  fmt.Sprintf("キーは文字列である必要があります。%q（%s）でした", k.Value, k.ShortTag()),
			})
			continue
		}
		f, known := findField(k.Value)
		if !known {
			problems = append(problems, Problem{
				Path: path,
				Msg:  fmt.Sprintf("不明なキー %q です。記事のキーは %s です", k.Value, fieldList()),
			})
			continue
		}
		if seen[k.Value] {
			problems = append(problems, Problem{
				Path: path,
				Msg:  fmt.Sprintf("キー %q が2回以上あります", k.Value),
			})
			continue
		}
		seen[k.Value] = true
		if err := f.decode(v, &post); err != nil {
			problems = append(problems, Problem{Path: path, Msg: f.key + ": " + err.Error()})
		}
	}
	for _, f := range postFields {
		if f.required && !seen[f.key] {
			problems = append(problems, Problem{
				Path: path,
				Msg:  fmt.Sprintf("必須のキー %q がありません", f.key),
			})
		}
	}
	if len(problems) > 0 {
		return Post{}, problems
	}
	post.Body = string(body)
	return post, nil
}

// An empty --- block unmarshals to a zero node. That is an empty mapping, so
// each required key is reported missing.
func mappingNode(doc yaml.Node) (*yaml.Node, bool) {
	if doc.Kind == 0 || (doc.Kind == yaml.DocumentNode && len(doc.Content) == 0) {
		return &yaml.Node{Kind: yaml.MappingNode}, true
	}
	if doc.Kind == yaml.DocumentNode && len(doc.Content) == 1 {
		return doc.Content[0], true
	}
	return nil, false
}

func deref(n *yaml.Node) *yaml.Node {
	if n != nil && n.Kind == yaml.AliasNode && n.Alias != nil {
		return n.Alias
	}
	return n
}

func renderPost(p Post) []byte {
	m := yaml.Node{Kind: yaml.MappingNode}
	for _, f := range postFields {
		v := f.encode(p)
		if v == nil {
			continue
		}
		var k yaml.Node
		k.SetString(f.key)
		n, err := encodeValue(v)
		if err != nil {
			panic(err)
		}
		m.Content = append(m.Content, &k, n)
	}
	out, err := yaml.Marshal(&m)
	if err != nil {
		panic(err)
	}
	var buf bytes.Buffer
	buf.WriteString("---\n")
	buf.Write(out)
	buf.WriteString("---\n")
	buf.WriteString(p.Body)
	return buf.Bytes()
}

func encodeValue(v any) (*yaml.Node, error) {
	if t, ok := v.(time.Time); ok {
		return &yaml.Node{
			Kind:  yaml.ScalarNode,
			Tag:   "!!timestamp",
			Value: t.Format(time.RFC3339),
		}, nil
	}
	var n yaml.Node
	if err := n.Encode(v); err != nil {
		return nil, err
	}
	return &n, nil
}

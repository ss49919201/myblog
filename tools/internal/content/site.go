package content

import (
	"cmp"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"slices"
	"strings"
)

type Problem struct {
	Path string
	Msg  string
}

func (p Problem) String() string { return p.Path + ": " + p.Msg }

const (
	configFile    = "src/content.config.ts"
	postsDir      = "src/content/posts"
	categoriesDir = "src/content/categories"
)

func Check(root string) ([]Problem, error) {
	s, err := load(os.DirFS(root))
	if err != nil {
		return nil, err
	}
	return s.problems(), nil
}

func Create(root string, p Post) (string, error) {
	s, err := load(os.DirFS(root))
	if err != nil {
		return "", err
	}
	path := postPath(p.Slug)
	src := renderPost(p)
	q, probs := parsePost(path, src)
	if len(probs) > 0 {
		return "", refuse(path, probs)
	}
	if !samePost(p, q) {
		return "", fmt.Errorf("内部エラー: %s を書き出して読み戻すと元の記事になりません", path)
	}
	full := filepath.Join(root, filepath.FromSlash(path))
	if _, err := os.Stat(full); err == nil {
		return "", fmt.Errorf("%s は既にあります", path)
	} else if !os.IsNotExist(err) {
		return "", err
	}
	var mine []Problem
	for _, prob := range siteRules(append(slices.Clone(s.posts), placed{path: path, post: q}), s.categories) {
		if prob.Path == path {
			mine = append(mine, prob)
		}
	}
	if len(mine) > 0 {
		sortProblems(mine)
		return "", refuse(path, mine)
	}
	if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
		return "", err
	}
	f, err := os.OpenFile(full, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		if os.IsExist(err) {
			return "", fmt.Errorf("%s は既にあります", path)
		}
		return "", err
	}
	_, werr := f.Write(src)
	cerr := f.Close()
	if werr != nil || cerr != nil {
		_ = os.Remove(full)
		if werr != nil {
			return "", werr
		}
		return "", cerr
	}
	return path, nil
}

func postPath(slug Slug) string { return postsDir + "/" + slug.String() + ".md" }

type site struct {
	posts      []placed
	categories map[Slug]struct{}
	broken     []Problem
}

type placed struct {
	path string
	post Post
}

func load(fsys fs.FS) (*site, error) {
	if _, err := fs.Stat(fsys, configFile); err != nil {
		return nil, errors.New("src/content.config.ts が見つかりません。blog はリポジトリのルートで実行してください")
	}
	s := &site{categories: map[Slug]struct{}{}}
	if err := walkMarkdown(fsys, categoriesDir, func(path string) error {
		rel := strings.TrimSuffix(strings.TrimPrefix(path, categoriesDir+"/"), ".md")
		id, err := ParseSlug(rel)
		if err != nil {
			s.broken = append(s.broken, Problem{
				Path: path,
				Msg:  "カテゴリファイルは src/content/categories/<id>.md で、id は1つのパス要素である必要があります",
			})
			return nil
		}
		s.categories[id] = struct{}{}
		return nil
	}); err != nil {
		return nil, err
	}
	if err := walkMarkdown(fsys, postsDir, func(path string) error {
		data, err := fs.ReadFile(fsys, path)
		if err != nil {
			return err
		}
		post, probs := parsePost(path, data)
		if len(probs) > 0 {
			s.broken = append(s.broken, probs...)
			return nil
		}
		s.posts = append(s.posts, placed{path: path, post: post})
		return nil
	}); err != nil {
		return nil, err
	}
	slices.SortFunc(s.posts, func(a, b placed) int { return cmp.Compare(a.path, b.path) })
	return s, nil
}

func walkMarkdown(fsys fs.FS, dir string, fn func(path string) error) error {
	info, err := fs.Stat(fsys, dir)
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return nil
		}
		return err
	}
	if !info.IsDir() {
		return fmt.Errorf("%s はディレクトリである必要があります", dir)
	}
	return fs.WalkDir(fsys, dir, func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}
		name := d.Name()
		if name != "." && strings.HasPrefix(name, ".") {
			if d.IsDir() {
				return fs.SkipDir
			}
			return nil
		}
		if d.IsDir() || !strings.HasSuffix(name, ".md") {
			return nil
		}
		return fn(path)
	})
}

func (s *site) problems() []Problem {
	probs := slices.Clone(s.broken)
	probs = append(probs, siteRules(s.posts, s.categories)...)
	sortProblems(probs)
	return probs
}

func sortProblems(probs []Problem) {
	slices.SortFunc(probs, func(a, b Problem) int {
		return cmp.Or(cmp.Compare(a.Path, b.Path), cmp.Compare(a.Msg, b.Msg))
	})
}

func siteRules(posts []placed, categories map[Slug]struct{}) []Problem {
	var probs []Problem
	bySlug := map[string][]string{}
	for _, p := range posts {
		slug := p.post.Slug.String()
		if p.path != postPath(p.post.Slug) {
			probs = append(probs, Problem{
				Path: p.path,
				Msg:  fmt.Sprintf("slug %q のファイルは %s である必要があります", slug, postPath(p.post.Slug)),
			})
		}
		bySlug[slug] = append(bySlug[slug], p.path)
		if p.post.Category != (Slug{}) {
			if _, ok := categories[p.post.Category]; !ok {
				probs = append(probs, Problem{
					Path: p.path,
					Msg:  fmt.Sprintf("カテゴリ %q のファイル src/content/categories/%s.md がありません", p.post.Category.String(), p.post.Category.String()),
				})
			}
		}
	}
	slugs := make([]string, 0, len(bySlug))
	for slug := range bySlug {
		slugs = append(slugs, slug)
	}
	slices.Sort(slugs)
	for _, slug := range slugs {
		paths := slices.Clone(bySlug[slug])
		if len(paths) < 2 {
			continue
		}
		slices.Sort(paths)
		for _, path := range paths {
			others := make([]string, 0, len(paths)-1)
			for _, other := range paths {
				if other != path {
					others = append(others, other)
				}
			}
			probs = append(probs, Problem{
				Path: path,
				Msg:  fmt.Sprintf("slug %q は %s でも使われています", slug, strings.Join(others, "、")),
			})
		}
	}
	return probs
}

// time.Time equality compares Location pointers, so the offset is compared
// separately from the instant.
func samePost(a, b Post) bool {
	_, aOff := a.Date.Zone()
	_, bOff := b.Date.Zone()
	return a.Title == b.Title &&
		a.Slug == b.Slug &&
		a.Date.Equal(b.Date) &&
		aOff == bOff &&
		a.Category == b.Category &&
		a.Draft == b.Draft &&
		a.Body == b.Body
}

func refuse(path string, probs []Problem) error {
	var b strings.Builder
	fmt.Fprintf(&b, "%s の作成を拒否します:", path)
	for _, p := range probs {
		fmt.Fprintf(&b, "\n  %s", p.String())
	}
	return errors.New(b.String())
}

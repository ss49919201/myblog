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

const DefaultPostsDir = "content/posts"

func ResolvePostsDir(postsDir string) string {
	if postsDir == "" {
		return DefaultPostsDir
	}
	return filepath.ToSlash(postsDir)
}

func Check(root string, postsDir string) ([]Problem, error) {
	dir := ResolvePostsDir(postsDir)
	s, err := load(os.DirFS(root), dir)
	if err != nil {
		return nil, err
	}
	return s.problems(dir), nil
}

func Create(root string, postsDir string, p Post) (string, error) {
	dir := ResolvePostsDir(postsDir)
	s, err := load(os.DirFS(root), dir)
	if err != nil {
		return "", err
	}
	path := PostPath(dir, p.Slug)
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
	for _, prob := range siteRules(append(slices.Clone(s.posts), placed{path: path, post: q}), dir) {
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

func PostPath(postsDir string, slug Slug) string {
	return ResolvePostsDir(postsDir) + "/" + slug.String() + ".md"
}

func ListMarkdownPosts(root, postsDir string) ([]string, error) {
	dir := ResolvePostsDir(postsDir)
	var paths []string
	err := walkMarkdown(os.DirFS(root), dir, func(path string) error {
		paths = append(paths, filepath.Join(root, filepath.FromSlash(path)))
		return nil
	})
	if err != nil {
		return nil, err
	}
	slices.Sort(paths)
	return paths, nil
}

type site struct {
	posts  []placed
	broken []Problem
}

type placed struct {
	path string
	post Post
}

func load(fsys fs.FS, postsDir string) (*site, error) {
	s := &site{}
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

func (s *site) problems(postsDir string) []Problem {
	probs := slices.Clone(s.broken)
	probs = append(probs, siteRules(s.posts, postsDir)...)
	sortProblems(probs)
	return probs
}

func sortProblems(probs []Problem) {
	slices.SortFunc(probs, func(a, b Problem) int {
		return cmp.Or(cmp.Compare(a.Path, b.Path), cmp.Compare(a.Msg, b.Msg))
	})
}

func siteRules(posts []placed, postsDir string) []Problem {
	var probs []Problem
	bySlug := map[string][]string{}
	for _, p := range posts {
		slug := p.post.Slug.String()
		want := PostPath(postsDir, p.post.Slug)
		if p.path != want {
			probs = append(probs, Problem{
				Path: p.path,
				Msg:  fmt.Sprintf("slug %q のファイルは %s である必要があります", slug, want),
			})
		}
		bySlug[slug] = append(bySlug[slug], p.path)
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

func samePost(a, b Post) bool {
	_, aOff := a.PublishedAt.Zone()
	_, bOff := b.PublishedAt.Zone()
	return a.Title == b.Title &&
		a.Slug == b.Slug &&
		a.PublishedAt.Equal(b.PublishedAt) &&
		aOff == bOff &&
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

package post

import (
	"context"
	"database/sql"
	"errors"

	_ "github.com/mattn/go-sqlite3"
)

var ErrNotFound = errors.New("post not found")

type Post struct {
	Filename string
	Title    string
	Markdown string
}

type Store struct{ db *sql.DB }

func NewSQLiteStore(ctx context.Context, path string) (*Store, error) {
	db, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	if _, err = db.ExecContext(ctx, "CREATE TABLE IF NOT EXISTS posts (filename TEXT PRIMARY KEY, title TEXT NOT NULL DEFAULT '', markdown TEXT NOT NULL)"); err == nil {
		var found int
		err = db.QueryRowContext(ctx, "SELECT 1 FROM pragma_table_info('posts') WHERE name='title'").Scan(&found)
		if errors.Is(err, sql.ErrNoRows) {
			_, err = db.ExecContext(ctx, "ALTER TABLE posts ADD COLUMN title TEXT NOT NULL DEFAULT ''")
		}
	}
	if err != nil {
		db.Close()
		return nil, err
	}
	return &Store{db: db}, nil
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) List(ctx context.Context) ([]Post, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT filename, title, markdown FROM posts ORDER BY filename")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var posts []Post
	for rows.Next() {
		var p Post
		if err := rows.Scan(&p.Filename, &p.Title, &p.Markdown); err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, rows.Err()
}

func (s *Store) Create(ctx context.Context, p Post) error {
	_, err := s.db.ExecContext(ctx, "INSERT INTO posts (filename, title, markdown) VALUES (?, ?, ?)", p.Filename, p.Title, p.Markdown)
	return err
}

func (s *Store) Update(ctx context.Context, p Post) error {
	result, err := s.db.ExecContext(ctx, "UPDATE posts SET title=?, markdown=? WHERE filename=?", p.Title, p.Markdown, p.Filename)
	if err != nil {
		return err
	}
	n, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

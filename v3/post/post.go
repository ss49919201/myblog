package post

import (
	"context"
	"database/sql"
	"errors"

	_ "github.com/mattn/go-sqlite3"
)

var ErrNotFound = errors.New("post not found")

type Post struct {
	ID       string
	Title    string
	Markdown string
}

func (p Post) Filename() string { return p.ID + ".md" }

type Store struct{ db *sql.DB }

func NewSQLiteStore(ctx context.Context, path string) (*Store, error) {
	db, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	if err := migrate(ctx, db); err != nil {
		db.Close()
		return nil, err
	}
	return &Store{db: db}, nil
}

func migrate(ctx context.Context, db *sql.DB) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, "CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, title TEXT NOT NULL DEFAULT '', markdown TEXT NOT NULL)"); err != nil {
		return err
	}
	var found int
	if err := tx.QueryRowContext(ctx, "SELECT 1 FROM pragma_table_info('posts') WHERE name='filename'").Scan(&found); err == nil {
		if _, err := tx.ExecContext(ctx, "ALTER TABLE posts RENAME COLUMN filename TO id"); err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, "UPDATE posts SET id = substr(id, 1, length(id) - 3) WHERE substr(id, -3) = '.md'"); err != nil {
			return err
		}
	} else if !errors.Is(err, sql.ErrNoRows) {
		return err
	}
	if err := tx.QueryRowContext(ctx, "SELECT 1 FROM pragma_table_info('posts') WHERE name='title'").Scan(&found); errors.Is(err, sql.ErrNoRows) {
		if _, err := tx.ExecContext(ctx, "ALTER TABLE posts ADD COLUMN title TEXT NOT NULL DEFAULT ''"); err != nil {
			return err
		}
	} else if err != nil {
		return err
	}
	return tx.Commit()
}

func (s *Store) Close() error { return s.db.Close() }

func (s *Store) List(ctx context.Context) ([]Post, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT id, title, markdown FROM posts ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var posts []Post
	for rows.Next() {
		var p Post
		if err := rows.Scan(&p.ID, &p.Title, &p.Markdown); err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, rows.Err()
}

func (s *Store) Create(ctx context.Context, p Post) error {
	_, err := s.db.ExecContext(ctx, "INSERT INTO posts (id, title, markdown) VALUES (?, ?, ?)", p.ID, p.Title, p.Markdown)
	return err
}

func (s *Store) Update(ctx context.Context, p Post) error {
	result, err := s.db.ExecContext(ctx, "UPDATE posts SET title=?, markdown=? WHERE id=?", p.Title, p.Markdown, p.ID)
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

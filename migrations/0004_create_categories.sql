CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

ALTER TABLE posts ADD COLUMN category_id INTEGER REFERENCES categories (id) ON DELETE SET NULL;

CREATE INDEX idx_posts_category_status_published_at ON posts (category_id, status, published_at DESC);

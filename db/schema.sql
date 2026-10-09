CREATE TABLE categories (
  slug TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE posts (
  slug TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  published_at TEXT NOT NULL,
  category_slug TEXT,
  draft INTEGER NOT NULL CHECK (draft IN (0, 1)),
  description TEXT NOT NULL,
  body_html TEXT NOT NULL,
  FOREIGN KEY (category_slug) REFERENCES categories (slug)
);

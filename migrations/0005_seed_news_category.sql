INSERT INTO categories (slug, name) VALUES ('news', 'お知らせ');

-- Leaves hello-world alone if it was already given a category.
UPDATE posts
SET
  category_id = (SELECT id FROM categories WHERE slug = 'news'),
  updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = 'hello-world'
  AND category_id IS NULL;

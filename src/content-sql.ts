import type { Content } from "./types.ts";

export function contentStatements(content: Content): string[] {
  const lines = ["DELETE FROM posts;", "DELETE FROM categories;"];
  const categories = [...content.categories].sort((a, b) => a.slug.localeCompare(b.slug));
  for (const category of categories) {
    lines.push(`INSERT INTO categories (slug, name) VALUES (${sqlString(category.slug)}, ${sqlString(category.name)});`);
  }
  const posts = [...content.posts].sort((a, b) => a.slug.localeCompare(b.slug));
  for (const post of posts) {
    const category = post.categorySlug === null ? "NULL" : sqlString(post.categorySlug);
    lines.push(
      `INSERT INTO posts (slug, title, published_at, category_slug, draft, description, body_html) VALUES (${sqlString(post.slug)}, ${sqlString(post.title)}, ${sqlString(post.publishedAt)}, ${category}, ${post.draft ? 1 : 0}, ${sqlString(post.description)}, ${sqlString(post.html)});`,
    );
  }
  return lines;
}

export function contentSql(content: Content): string {
  return ["BEGIN;", ...contentStatements(content), "COMMIT;"].join("\n");
}

function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

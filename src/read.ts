import type { CategoryLink, SqlRead, VisiblePost } from "./types.ts";

const visibleColumns = `posts.slug, posts.title, posts.published_at, posts.description, posts.body_html,
       categories.slug AS category_slug, categories.name AS category_name`;

const visibleFrom = `FROM posts
LEFT JOIN categories ON categories.slug = posts.category_slug
WHERE posts.draft = 0 AND posts.published_at <= ?`;

export async function visiblePosts(sql: SqlRead, now: Date): Promise<VisiblePost[]> {
  const rows = await sql.all(
    `SELECT ${visibleColumns} ${visibleFrom} ORDER BY posts.published_at DESC, posts.slug ASC`,
    [now.toISOString()],
  );
  return rows.map(parseVisiblePost);
}

export async function visiblePost(sql: SqlRead, slug: string, now: Date): Promise<VisiblePost | undefined> {
  const rows = await sql.all(`SELECT ${visibleColumns} ${visibleFrom} AND posts.slug = ?`, [now.toISOString(), slug]);
  const row = rows[0];
  if (!row) return undefined;
  return parseVisiblePost(row);
}

export async function visiblePostsInCategory(sql: SqlRead, slug: string, now: Date): Promise<VisiblePost[]> {
  const rows = await sql.all(
    `SELECT ${visibleColumns} ${visibleFrom} AND posts.category_slug = ? ORDER BY posts.published_at DESC, posts.slug ASC`,
    [now.toISOString(), slug],
  );
  return rows.map(parseVisiblePost);
}

export async function categoryBySlug(sql: SqlRead, slug: string): Promise<CategoryLink | undefined> {
  const rows = await sql.all("SELECT slug, name FROM categories WHERE slug = ?", [slug]);
  const row = rows[0];
  if (!row) return undefined;
  return parseCategory(row);
}

export async function categories(sql: SqlRead): Promise<CategoryLink[]> {
  const rows = await sql.all("SELECT slug, name FROM categories ORDER BY slug ASC", []);
  return rows.map(parseCategory);
}

function parseVisiblePost(row: unknown): VisiblePost {
  const record = recordOf(row);
  const categorySlug = optionalString(record, "category_slug");
  const categoryName = optionalString(record, "category_name");
  if ((categorySlug === null) !== (categoryName === null)) {
    throw new Error("category slug and name disagree");
  }
  return {
    slug: requiredString(record, "slug"),
    title: requiredString(record, "title"),
    publishedAt: requiredString(record, "published_at"),
    description: requiredString(record, "description"),
    html: requiredString(record, "body_html"),
    category: categorySlug === null || categoryName === null ? null : { slug: categorySlug, name: categoryName },
  };
}

function parseCategory(row: unknown): CategoryLink {
  const record = recordOf(row);
  return { slug: requiredString(record, "slug"), name: requiredString(record, "name") };
}

function recordOf(row: unknown): Record<string, unknown> {
  if (!isRecord(row)) throw new Error("row is not an object");
  return row;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string") throw new Error(`${key} is not a string`);
  return value;
}

function optionalString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new Error(`${key} is not a string`);
  return value;
}

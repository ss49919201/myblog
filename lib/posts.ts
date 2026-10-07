import { env } from "cloudflare:workers";

type PostStatus = "draft" | "published";

export type Post = {
  id: number;
  slug: string;
  title: string;
  body: string;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  category_slug: string | null;
  category_name: string | null;
};

export type PostSummary = Omit<Post, "body">;

type Category = {
  id: number;
  slug: string;
  name: string;
};

const SUMMARY_COLUMNS =
  "p.id, p.slug, p.title, p.status, p.created_at, p.updated_at, p.published_at, c.slug AS category_slug, c.name AS category_name";

const FROM_POSTS = "FROM posts p LEFT JOIN categories c ON c.id = p.category_id";

export async function listPublishedPosts(): Promise<PostSummary[]> {
  const { results } = await env.DB.prepare(
    `SELECT ${SUMMARY_COLUMNS} ${FROM_POSTS} WHERE p.status = 'published' ORDER BY p.published_at DESC`,
  ).all<PostSummary>();
  return results;
}

export async function searchPublishedPosts(query: string): Promise<PostSummary[]> {
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  const { results } = await env.DB.prepare(
    `SELECT ${SUMMARY_COLUMNS} ${FROM_POSTS}
     WHERE p.status = 'published'
       AND (p.title LIKE ?1 ESCAPE '\\' OR p.body LIKE ?1 ESCAPE '\\')
     ORDER BY p.published_at DESC`,
  )
    .bind(pattern)
    .all<PostSummary>();
  return results;
}

export async function listPublishedPostsByCategory(categoryId: number): Promise<PostSummary[]> {
  const { results } = await env.DB.prepare(
    `SELECT ${SUMMARY_COLUMNS} ${FROM_POSTS} WHERE p.category_id = ? AND p.status = 'published' ORDER BY p.published_at DESC`,
  )
    .bind(categoryId)
    .all<PostSummary>();
  return results;
}

export async function findPublishedPostBySlug(slug: string): Promise<Post | null> {
  return env.DB.prepare(
    `SELECT ${SUMMARY_COLUMNS}, p.body ${FROM_POSTS} WHERE p.slug = ? AND p.status = 'published'`,
  )
    .bind(slug)
    .first<Post>();
}

export async function findCategoryBySlug(slug: string): Promise<Category | null> {
  return env.DB.prepare("SELECT id, slug, name FROM categories WHERE slug = ?").bind(slug).first<Category>();
}

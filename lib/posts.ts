import { env } from "cloudflare:workers";

export type PostStatus = "draft" | "published";

export type Post = {
  id: number;
  slug: string;
  title: string;
  body: string;
  status: PostStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type PostSummary = Omit<Post, "body">;

export type PostInput = {
  slug: string;
  title: string;
  body: string;
  status: PostStatus;
};

const SUMMARY_COLUMNS = "id, slug, title, status, created_at, updated_at, published_at";

export async function listPublishedPosts(): Promise<PostSummary[]> {
  const { results } = await env.DB.prepare(
    `SELECT ${SUMMARY_COLUMNS} FROM posts WHERE status = 'published' ORDER BY published_at DESC`,
  ).all<PostSummary>();
  return results;
}

export async function listAllPosts(): Promise<PostSummary[]> {
  const { results } = await env.DB.prepare(
    `SELECT ${SUMMARY_COLUMNS} FROM posts ORDER BY updated_at DESC`,
  ).all<PostSummary>();
  return results;
}

export async function findPublishedPostBySlug(slug: string): Promise<Post | null> {
  return env.DB.prepare("SELECT * FROM posts WHERE slug = ? AND status = 'published'")
    .bind(slug)
    .first<Post>();
}

export async function findPostById(id: number): Promise<Post | null> {
  return env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first<Post>();
}

export async function createPost(input: PostInput): Promise<number> {
  const row = await env.DB.prepare(
    `INSERT INTO posts (slug, title, body, status, published_at)
     VALUES (?1, ?2, ?3, ?4, CASE WHEN ?4 = 'published' THEN strftime('%Y-%m-%dT%H:%M:%SZ', 'now') END)
     RETURNING id`,
  )
    .bind(input.slug, input.title, input.body, input.status)
    .first<{ id: number }>();
  return row!.id;
}

export async function updatePost(id: number, input: PostInput): Promise<void> {
  await env.DB.prepare(
    `UPDATE posts SET
       slug = ?2,
       title = ?3,
       body = ?4,
       status = ?5,
       updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now'),
       published_at = CASE
         WHEN ?5 = 'published' THEN COALESCE(published_at, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
         ELSE published_at
       END
     WHERE id = ?1`,
  )
    .bind(id, input.slug, input.title, input.body, input.status)
    .run();
}

export async function deletePost(id: number): Promise<void> {
  await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
}

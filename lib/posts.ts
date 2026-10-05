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
};

export type PostSummary = Omit<Post, "body">;

const SUMMARY_COLUMNS = "id, slug, title, status, created_at, updated_at, published_at";

export async function listPublishedPosts(): Promise<PostSummary[]> {
  const { results } = await env.DB.prepare(
    `SELECT ${SUMMARY_COLUMNS} FROM posts WHERE status = 'published' ORDER BY published_at DESC`,
  ).all<PostSummary>();
  return results;
}

export async function findPublishedPostBySlug(slug: string): Promise<Post | null> {
  return env.DB.prepare("SELECT * FROM posts WHERE slug = ? AND status = 'published'")
    .bind(slug)
    .first<Post>();
}

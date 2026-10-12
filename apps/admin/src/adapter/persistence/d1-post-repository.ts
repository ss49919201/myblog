import type { PostRecord, PostRepository } from '../../port/post-repository'

export function createD1PostRepository(db: D1Database): PostRepository {
  return {
    async slugExists(slug: string): Promise<boolean> {
      const row = await db
        .prepare('SELECT 1 AS ok FROM posts WHERE slug = ?')
        .bind(slug)
        .first<{ ok: number }>()
      return row !== null
    },

    async insert(post: PostRecord): Promise<void> {
      await db
        .prepare(
          `INSERT INTO posts (slug, title, published_at, body_html, body_md)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(
          post.slug,
          post.title,
          post.publishedAt.toISOString(),
          post.bodyHtml,
          post.bodyMd,
        )
        .run()
    },
  }
}

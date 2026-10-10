import type { FC } from 'hono/jsx'
import type { Post } from '../posts/types'
import { formatPublishedAt } from './format'
import { Layout } from './Layout'

type PostPageProps = {
  post: Post
}

function bodyParagraphs(body: string): string[] {
  return body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)
}

export const PostPage: FC<PostPageProps> = ({ post }) => (
  <Layout title={`${post.title} | myblog`}>
    <article>
      <h1 style={{ fontSize: '1.75rem', marginTop: 0, lineHeight: 1.3 }}>
        {post.title}
      </h1>
      <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
        <time dateTime={post.publishedAt.toISOString()}>
          {formatPublishedAt(post.publishedAt)}
        </time>
      </p>
      <div
        style={{
          borderTop: '1px solid #c4b5fd',
          paddingTop: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {bodyParagraphs(post.body).map((paragraph) => (
          <p key={paragraph.slice(0, 24)} style={{ margin: 0 }}>
            {paragraph}
          </p>
        ))}
      </div>
      <p style={{ marginTop: '2rem' }}>
        <a href="/">← 一覧へ</a>
      </p>
    </article>
  </Layout>
)

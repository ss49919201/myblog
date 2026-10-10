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
    <article class="article">
      <h1 class="article-title">{post.title}</h1>
      <p class="article-meta">
        <time class="date-pill" dateTime={post.publishedAt.toISOString()}>
          {formatPublishedAt(post.publishedAt)}
        </time>
      </p>
      <div class="article-body">
        {bodyParagraphs(post.body).map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>
      <a class="back-link" href="/">← 一覧へ</a>
    </article>
  </Layout>
)

import type { FC } from 'hono/jsx'
import { raw } from 'hono/html'
import type { PageMeta } from '../meta'
import type { Post } from '../posts/types'
import { formatPublishedAt } from './format'
import { Layout } from './Layout'

type PostPageProps = {
  post: Post
  meta: PageMeta
}

export const PostPage: FC<PostPageProps> = ({ post, meta }) => (
  <Layout title={meta.title} meta={meta}>
    <article class="article">
      <h1 class="article-title">{post.title}</h1>
      <p class="article-meta">
        <time class="date-pill" dateTime={post.publishedAt.toISOString()}>
          {formatPublishedAt(post.publishedAt)}
        </time>
      </p>
      <div class="article-body">{raw(post.bodyHtml)}</div>
      <a class="back-link" href="/">← 一覧へ</a>
    </article>
  </Layout>
)

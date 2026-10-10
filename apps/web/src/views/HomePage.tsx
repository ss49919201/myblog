import type { FC } from 'hono/jsx'
import type { PageMeta } from '../meta'
import type { Post } from '../posts/types'
import { formatPublishedAt } from './format'
import { Layout } from './Layout'

type HomePageProps = {
  posts: Post[]
  meta: PageMeta
}

export const HomePage: FC<HomePageProps> = ({ posts, meta }) => (
  <Layout title={meta.title} meta={meta}>
    <h1 class="page-heading">記事一覧</h1>
    <ul class="post-list">
      {posts.map((post) => (
        <li key={post.slug} class="post-card">
          <h2 class="post-card-title">
            <a href={`/posts/${post.slug}`}>{post.title}</a>
          </h2>
          <time class="date-pill" dateTime={post.publishedAt.toISOString()}>
            {formatPublishedAt(post.publishedAt)}
          </time>
        </li>
      ))}
    </ul>
  </Layout>
)

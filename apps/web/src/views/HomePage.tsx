import type { FC } from 'hono/jsx'
import type { Post } from '../posts/types'
import { formatPublishedAt } from './format'
import { Layout } from './Layout'

type HomePageProps = {
  posts: Post[]
}

export const HomePage: FC<HomePageProps> = ({ posts }) => (
  <Layout title="記事一覧 | myblog">
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

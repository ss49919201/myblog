import type { FC } from 'hono/jsx'
import type { Post } from '../posts/types'
import { formatPublishedAt } from './format'
import { Layout } from './Layout'

type HomePageProps = {
  posts: Post[]
}

export const HomePage: FC<HomePageProps> = ({ posts }) => (
  <Layout title="記事一覧 | myblog">
    <h1 style={{ fontSize: '1.5rem', marginTop: 0 }}>記事一覧</h1>
    <ul
      style={{
        listStyle: 'none',
        padding: 0,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
      }}
    >
      {posts.map((post) => (
        <li
          key={post.slug}
          style={{
            paddingBottom: '1.25rem',
            borderBottom: '1px solid #c4b5fd',
          }}
        >
          <h2 style={{ fontSize: '1.125rem', margin: '0 0 0.35rem' }}>
            <a href={`/posts/${post.slug}`}>{post.title}</a>
          </h2>
          <time
            dateTime={post.publishedAt.toISOString()}
            style={{ fontSize: '0.875rem', color: '#6b7280' }}
          >
            {formatPublishedAt(post.publishedAt)}
          </time>
        </li>
      ))}
    </ul>
  </Layout>
)

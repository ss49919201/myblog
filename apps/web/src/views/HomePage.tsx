import { Badge, LayerCard, Link, Text } from '@cloudflare/kumo'
import type { PageMeta } from '../meta'
import type { Post } from '../posts/types'
import { formatPublishedAt } from './format'
import { Layout } from './Layout'

type HomePageProps = {
  posts: Post[]
  meta: PageMeta
}

export function HomePage({ posts, meta }: HomePageProps) {
  return (
    <Layout title={meta.title} meta={meta}>
      <div className="mb-6 font-semibold">
        <Text variant="heading" size="lg">記事一覧</Text>
      </div>
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {posts.map((post) => (
          <li key={post.slug}>
            <LayerCard className="p-4">
              <LayerCard.Primary>
                <div className="mb-2 font-semibold">
                  <Text variant="heading">
                    <Link href={`/posts/${post.slug}`} variant="plain">
                      {post.title}
                    </Link>
                  </Text>
                </div>
                <Badge variant="secondary">
                  <time dateTime={post.publishedAt.toISOString()}>
                    {formatPublishedAt(post.publishedAt)}
                  </time>
                </Badge>
              </LayerCard.Primary>
            </LayerCard>
          </li>
        ))}
      </ul>
    </Layout>
  )
}

import { Badge, LayerCard, LinkButton, Text } from '@cloudflare/kumo'
import type { PageMeta } from '../meta'
import type { Post } from '../posts/types'
import { formatPublishedAt } from './format'
import { Layout } from './Layout'

type PostPageProps = {
  post: Post
  meta: PageMeta
}

export function PostPage({ post, meta }: PostPageProps) {
  return (
    <Layout title={meta.title} meta={meta}>
      <article>
        <LayerCard className="p-5">
          <LayerCard.Primary>
            <div className="mb-3 font-semibold">
              <Text variant="heading" size="lg">{post.title}</Text>
            </div>
            <Badge variant="secondary" className="mb-5">
              <time dateTime={post.publishedAt.toISOString()}>
                {formatPublishedAt(post.publishedAt)}
              </time>
            </Badge>
            <div
              className="prose-kumo flex flex-col gap-4 border-t border-kumo-line pt-5 text-kumo-default [&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: post.bodyHtml }}
            />
          </LayerCard.Primary>
        </LayerCard>
        <div className="mt-6">
          <LinkButton href="/" variant="secondary">
            ← 一覧へ
          </LinkButton>
        </div>
      </article>
    </Layout>
  )
}

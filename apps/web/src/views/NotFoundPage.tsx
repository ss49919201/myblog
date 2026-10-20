import { Banner, LinkButton } from '@cloudflare/kumo'
import type { PageMeta } from '../meta'
import { Layout } from './Layout'

type NotFoundPageProps = {
  meta: PageMeta
}

export function NotFoundPage({ meta }: NotFoundPageProps) {
  return (
    <Layout title={meta.title} meta={meta}>
      <Banner variant="secondary" title="ページが見つかりません">
        指定された記事は存在しないか、URL が間違っています。
      </Banner>
      <div className="mt-6">
        <LinkButton href="/" variant="secondary">
          一覧へ戻る
        </LinkButton>
      </div>
    </Layout>
  )
}

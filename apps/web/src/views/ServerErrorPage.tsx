import { Banner, LinkButton } from '@cloudflare/kumo'
import type { PageMeta } from '../meta'
import { Layout } from './Layout'

type ServerErrorPageProps = {
  meta: PageMeta
}

export function ServerErrorPage({ meta }: ServerErrorPageProps) {
  return (
    <Layout title={meta.title} meta={meta}>
      <Banner variant="error" title="サーバーエラー">
        記事の取得に失敗しました。しばらくしてから再度お試しください。
      </Banner>
      <div className="mt-6">
        <LinkButton href="/" variant="secondary">
          一覧へ戻る
        </LinkButton>
      </div>
    </Layout>
  )
}

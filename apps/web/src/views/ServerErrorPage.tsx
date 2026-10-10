import type { FC } from 'hono/jsx'
import type { PageMeta } from '../meta'
import { Layout } from './Layout'

type ServerErrorPageProps = {
  meta: PageMeta
}

export const ServerErrorPage: FC<ServerErrorPageProps> = ({ meta }) => (
  <Layout title={meta.title} meta={meta}>
    <div class="panel">
      <h1 class="page-heading">サーバーエラー</h1>
      <p>記事の取得に失敗しました。しばらくしてから再度お試しください。</p>
      <p>
        <a class="back-link" href="/">一覧へ戻る</a>
      </p>
    </div>
  </Layout>
)

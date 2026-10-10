import type { FC } from 'hono/jsx'
import type { PageMeta } from '../meta'
import { Layout } from './Layout'

type NotFoundPageProps = {
  meta: PageMeta
}

export const NotFoundPage: FC<NotFoundPageProps> = ({ meta }) => (
  <Layout title={meta.title} meta={meta}>
    <div class="panel">
      <h1 class="page-heading">ページが見つかりません</h1>
      <p>指定された記事は存在しないか、URL が間違っています。</p>
      <p>
        <a class="back-link" href="/">一覧へ戻る</a>
      </p>
    </div>
  </Layout>
)

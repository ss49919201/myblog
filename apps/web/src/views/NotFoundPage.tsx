import type { FC } from 'hono/jsx'
import { Layout } from './Layout'

export const NotFoundPage: FC = () => (
  <Layout title="404 | myblog">
    <div class="panel">
      <h1 class="page-heading">ページが見つかりません</h1>
      <p>指定された記事は存在しないか、URL が間違っています。</p>
      <p>
        <a class="back-link" href="/">一覧へ戻る</a>
      </p>
    </div>
  </Layout>
)

import type { FC } from 'hono/jsx'
import { Layout } from './Layout'

export const NotFoundPage: FC = () => (
  <Layout title="404 | myblog">
    <h1 style={{ fontSize: '1.5rem', marginTop: 0 }}>ページが見つかりません</h1>
    <p>指定された記事は存在しないか、URL が間違っています。</p>
    <p>
      <a href="/">一覧へ戻る</a>
    </p>
  </Layout>
)

import type { FC } from 'hono/jsx'
import { Layout } from './Layout'

export const ServerErrorPage: FC = () => (
  <Layout title="500 | myblog">
    <h1 style={{ fontSize: '1.5rem', marginTop: 0 }}>サーバーエラー</h1>
    <p>記事の取得に失敗しました。しばらくしてから再度お試しください。</p>
    <p>
      <a href="/">一覧へ戻る</a>
    </p>
  </Layout>
)

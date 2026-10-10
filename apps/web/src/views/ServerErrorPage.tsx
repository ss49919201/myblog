import type { FC } from 'hono/jsx'
import { Layout } from './Layout'

export const ServerErrorPage: FC = () => (
  <Layout title="500 | myblog">
    <div class="panel">
      <h1 class="page-heading">サーバーエラー</h1>
      <p>記事の取得に失敗しました。しばらくしてから再度お試しください。</p>
      <p>
        <a class="back-link" href="/">一覧へ戻る</a>
      </p>
    </div>
  </Layout>
)

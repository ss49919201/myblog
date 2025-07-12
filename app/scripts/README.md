# Scripts

このディレクトリには、開発とメンテナンス用のスクリプトが含まれています。

## seed-kv-data.js

Cloudflare KV Local 環境用のダミーデータ作成スクリプトです。

### 前提条件

- `wrangler` がインストールされていること
- `wrangler dev` が起動していること（別ターミナルで）

### 使用方法

#### ダミーデータの作成

```bash
# 直接実行
node scripts/seed-kv-data.js

# npm script として実行
npm run seed:kv
```

#### 保存されているデータの確認

```bash
# 直接実行
node scripts/seed-kv-data.js --list

# npm script として実行  
npm run seed:kv:list
```

#### ヘルプの表示

```bash
node scripts/seed-kv-data.js --help
```

### 作成されるダミーデータ

以下の5つのブログ投稿がKVストレージに保存されます：

1. `post-001`: Next.js 15 の新機能について
2. `post-002`: Cloudflare Workers と KV の活用法  
3. `post-003`: React Server Components の実践的な使い方
4. `post-004`: TypeScript 5.x の新機能と活用法
5. `post-005`: Web Performance 最適化のベストプラクティス

### 実行手順

1. 別ターミナルで wrangler dev を起動：
   ```bash
   wrangler dev
   ```

2. ダミーデータを作成：
   ```bash
   npm run seed:kv
   ```

3. アプリケーションでデータを確認：
   - http://localhost:3000 でブログ一覧を確認
   - 各投稿の詳細ページにアクセス可能

### トラブルシューティング

#### `wrangler` コマンドが見つからない場合

```bash
npm install -g wrangler
# または
npx wrangler --version
```

#### KV データの削除

個別のキーを削除する場合：
```bash
wrangler kv:key delete "post-001" --binding KV_POST --local
```

すべてのローカルKVデータをクリアしたい場合は、wrangler dev を再起動してください。

### データ形式

各投稿は以下のJSON形式で保存されます：

```json
{
  "id": "post-001",
  "title": "投稿のタイトル", 
  "body": "投稿の本文（Markdown形式）"
}
```

この形式は `src/query/post.ts` の `Post` 型と一致しています。
# カスタム ESLint ルール

このプロジェクトでは、コードの品質と一貫性を保つためのカスタムESLintルールを定義しています。

## ルール一覧

### `custom/no-direct-kv-access`

**目的**: KVデータ操作は必ず `./src/query` モジュールを経由することを強制する

**説明**: Cloudflare KVストレージへの直接アクセスを防ぎ、データアクセス層の一貫性を保ちます。

#### 禁止されるパターン

```javascript
// ❌ 直接的なgetCloudflareContext()の使用
import { getCloudflareContext } from "@opennextjs/cloudflare";
const context = await getCloudflareContext();

// ❌ KVストレージへの直接アクセス
const kv = context.env.KV_POST;
await kv.get("key");

// ❌ env経由でのKVアクセス
const data = await env.KV_POST.get("key");
```

#### 推奨されるパターン

```javascript
// ✅ src/queryモジュール経由でのアクセス
import { getPost, searchPosts } from "@/query/post";

const post = await getPost("post-001");
const allPosts = await searchPosts();
```

#### 除外対象

- `src/query/` ディレクトリ内のファイル（データアクセス層として許可）

#### エラーメッセージ

- `getCloudflareContext()の直接使用は禁止されています。./src/query のモジュールを使用してください。`
- `KVデータへの直接アクセスは禁止されています。./src/query のモジュールを使用してください。`

## 設定方法

ESLint設定ファイル (`eslint.config.mjs`) で以下のように設定されています：

```javascript
{
  plugins: {
    "custom": customRules,
  },
  rules: {
    "custom/no-direct-kv-access": "error",
  },
}
```

## 利点

1. **データアクセスの一元化**: すべてのKVアクセスがsrc/queryを経由することで、データアクセス層が明確になります
2. **保守性の向上**: データアクセスロジックの変更が必要な場合、src/query内のファイルのみを修正すれば済みます
3. **テスタビリティ**: データアクセス層をモックしやすくなります
4. **エラーハンドリングの統一**: ログ出力やエラーハンドリングを一箇所で管理できます

## 実行方法

```bash
# プロジェクト全体をチェック
npm run lint

# 特定のファイルをチェック
npx eslint src/components/HomePage.tsx
```
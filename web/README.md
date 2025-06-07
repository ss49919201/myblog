# MyBlog Web Frontend

Next.js で構築されたブログアプリケーションのフロントエンドです。

## 機能

- ブログ投稿の一覧表示
- 投稿の詳細表示
- 投稿の分析機能

## 開発環境のセットアップ

1. 依存関係のインストール:
```bash
npm install
```

2. 開発サーバーの起動:
```bash
npm run dev
```

3. ブラウザで http://localhost:3000 を開く

## API連携

このフロントエンドは、バックエンドAPI（デフォルト: http://localhost:8080）と連携します。
バックエンドが起動していることを確認してください。

## ビルド

```bash
npm run build
npm start
```

## 技術スタック

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- ESLint
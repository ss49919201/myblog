#!/usr/bin/env node

/**
 * Cloudflare KV Local 環境用ダミーデータ作成スクリプト
 *
 * 使用方法:
 * 1. wrangler dev を起動しておく
 * 2. node scripts/seed-kv-data.js を実行
 */

const fs = require("fs");
const path = require("path");

// ダミーデータ
const dummyPosts = [
  {
    id: "post-001",
    title: "Next.js 15 の新機能について",
    body: `Next.js 15 がリリースされ、多くの新機能と改善が追加されました。

## 主な新機能

### App Router の安定化
App Router が stable になり、プロダクション環境での利用が推奨されています。

### Server Components の改善
React Server Components のパフォーマンスが大幅に向上しました。

### 画像最適化の強化
Image コンポーネントが更に最適化され、より高速な画像読み込みが可能になりました。

これらの機能により、より高速で効率的なWebアプリケーションの開発が可能になります。`,
  },
  {
    id: "post-002",
    title: "Cloudflare Workers と KV の活用法",
    body: `Cloudflare Workers と KV ストレージを組み合わせることで、高速なエッジコンピューティングが実現できます。

## KV ストレージの特徴

### グローバル分散
世界中のエッジロケーションにデータが複製され、低レイテンシでアクセス可能です。

### 高可用性
99.9% の稼働率を保証し、信頼性の高いデータストレージを提供します。

### スケーラビリティ
自動的にスケールし、大量のリクエストにも対応できます。

実際のプロジェクトでの活用事例も紹介していきます。`,
  },
  {
    id: "post-003",
    title: "React Server Components の実践的な使い方",
    body: `React Server Components (RSC) を実際のプロジェクトで活用する方法について解説します。

## Server Components のメリット

### バンドルサイズの削減
サーバーサイドでレンダリングされるため、クライアントに送信されるJavaScriptが削減されます。

### SEO の向上
サーバーサイドでHTMLが生成されるため、SEOに有利です。

### パフォーマンスの向上
初期表示が高速化され、ユーザー体験が向上します。

## 実装のポイント

- "use client" ディレクティブの適切な使用
- データフェッチングの最適化
- キャッシュ戦略の検討

これらのポイントを押さえることで、効率的なアプリケーションが開発できます。`,
  },
  {
    id: "post-004",
    title: "TypeScript 5.x の新機能と活用法",
    body: `TypeScript 5.x シリーズで追加された新機能について、実践的な観点から解説します。

## 主な新機能

### const assertions の強化
より正確な型推論が可能になりました。

### template literal types の改善
文字列リテラル型の操作がより柔軟になっています。

### satisfies operator
型の安全性を保ちながら、より表現力豊かなコードが書けます。

## 実践での活用

これらの機能を実際のプロジェクトで活用する具体的な例も紹介していきます。`,
  },
  {
    id: "post-005",
    title: "Web Performance 最適化のベストプラクティス",
    body: `Webサイトのパフォーマンス最適化について、実践的なテクニックを紹介します。

## Core Web Vitals の改善

### LCP (Largest Contentful Paint)
- 画像の最適化
- フォントの読み込み最適化
- Critical CSS の実装

### FID (First Input Delay)
- JavaScript の最適化
- Code Splitting の活用
- Lazy Loading の実装

### CLS (Cumulative Layout Shift)
- レイアウトシフトの防止
- 画像サイズの事前指定
- Web フォントの最適化

これらの指標を改善することで、ユーザー体験とSEOの両方を向上させることができます。`,
  },
];

/**
 * KV にデータを保存する関数
 */
async function seedKVData() {
  console.log("🌱 Cloudflare KV Local にダミーデータを作成中...");

  try {
    for (const post of dummyPosts) {
      console.log(`📝 投稿を作成中: ${post.title}`);

      // KV に直接アクセスするため、wrangler kv key put コマンドを使用
      const { execSync } = require("child_process");

      // JSON形式でデータを保存
      const command = `wrangler kv key put "${post.id}" '${JSON.stringify(post)}' --binding KV_POST --local`;

      try {
        execSync(command, { stdio: "inherit" });
        console.log(`✅ ${post.id} を保存しました`);
      } catch (error) {
        console.error(`❌ ${post.id} の保存に失敗しました:`, error.message);
      }
    }

    console.log("\n🎉 ダミーデータの作成が完了しました！");
    console.log("\n📋 作成されたデータ:");
    dummyPosts.forEach((post) => {
      console.log(`- ${post.id}: ${post.title}`);
    });
  } catch (error) {
    console.error("❌ エラーが発生しました:", error);
    process.exit(1);
  }
}

/**
 * KV データを確認する関数
 */
async function listKVData() {
  console.log("\n🔍 KV データを確認中...");

  try {
    const { execSync } = require("child_process");
    const command = "wrangler kv key list --binding KV_POST --local";

    const result = execSync(command, { encoding: "utf8" });
    console.log("📋 保存されているキー:", result);
  } catch (error) {
    console.error("❌ データの確認に失敗しました:", error.message);
  }
}

/**
 * メイン処理
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--list")) {
    await listKVData();
  } else if (args.includes("--help")) {
    console.log(`
Cloudflare KV Local ダミーデータ管理スクリプト

使用方法:
  node scripts/seed-kv-data.js           ダミーデータを作成
  node scripts/seed-kv-data.js --list    保存されているデータを確認
  node scripts/seed-kv-data.js --help    このヘルプを表示

前提条件:
- wrangler がインストールされていること
- wrangler dev が起動していること (別ターミナルで)
    `);
  } else {
    await seedKVData();
    await listKVData();
  }
}

// スクリプト実行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { dummyPosts, seedKVData, listKVData };

---
name: blog-admin-ui
description: >-
  packages/admin のブログ記事管理 UI を、HTML/CSS を学びながら React (JSX) +
  TypeScript で実装する。シンプルなセマンティック HTML、プレーン CSS、最小限の
  コンポーネント分割を守る。packages/admin、管理画面、記事一覧、admin UI の
  追加・変更、HTML/CSS 学習付きの実装依頼で使用する。
---

# blog-admin-ui（packages/admin）

`packages/admin` のフロントエンドを触るときは、次の制約と説明方針に従う。

## 開発制約（ユーザー指定・変更しない）

1. HTML/CSSの基本的な機能を優先して使用する。
2. 不必要なdivや複雑なCSSを追加しない。
3. レイアウトにはFlexboxやGridなどの標準機能を活用する。
4. 新しいCSSプロパティやHTML要素を使用した場合、その役割と採用理由を説明する。
5. UIを実現するための別の方法があれば、簡潔に比較する。
6. 私が理解できるよう、実装の意図を説明する。
7. 過度な抽象化や独自コンポーネントの導入は避ける。

## 技術スタック

| 項目     | 方針                                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------- |
| 場所     | `packages/admin`                                                                                      |
| UI       | React 19 + JSX + TypeScript                                                                           |
| ビルド   | Vite（`@vitejs/plugin-react`）                                                                        |
| スタイル | **プレーン `.css`**（`src/*.css` を import）。CSS Modules / Tailwind / styled-components は導入しない |

## HTML / JSX

- ランドマークを優先: `header`, `main`, `nav`, `section` など。意味のない `div` のラッパーは増やさない。
- 表形式の管理一覧は `<table>` + `<thead>` / `<tbody>` + `<th scope="col">` を第一候補にする（カード一覧が明らかに適切な場合のみ `ul` + Flex/Grid）。
- ナビゲーションは `<a>`、フォーム送信は `<button type="submit">`。
- アクセシビリティ: 表に `<caption>`（必要なら `.visually-hidden`）、読み替え用に `role="status"` / `aria-live` を適宜使う。

## CSS

- 色・余白は `:root` の CSS 変数でまとめる（既存 `src/list.css` に合わせる）。
- レイアウトは Flexbox / Grid。float や過剰な absolute 配置は避ける。
- 修飾は BEM 風のクラス名（例: `badge`, `badge--published`）。コンポーネントごとに CSS ファイルを増やしすぎない（ページ単位 or 1 global で開始）。

## React / TypeScript

- ページは `src/pages/`、共有型は `src/types/`。`App.tsx` は薄い入口。
- 状態は `useState` / `useEffect` から始める。判別可能 union（例: `LoadState`）で loading / ready / error を表現する。
- 小さな表示用関数（日付フォーマット等）はページ内または同ディレクトリに置き、早い段階で「汎用 hooks / UI キット」にしない。
- 新規 UI ライブラリ（MUI, Chakra 等）はユーザーが明示するまで入れない。

## 実装後の説明（制約 4〜6）

変更をユーザーに返すとき、次を含める（大規模変更でない限り簡潔に）:

1. **意図**: なぜその HTML 構造・CSS・React の分け方にしたか。
2. **新規要素・プロパティ**: 初めて使うものだけ、役割と採用理由。
3. **比較**: 別案（例: table vs ul、flex vs grid）を1〜2文。

## 参照実装

既存コードに合わせる:

- 一覧: [PostListPage.tsx](../../../packages/admin/src/pages/PostListPage.tsx)
- 型: [post.ts](../../../packages/admin/src/types/post.ts)
- スタイル: [list.css](../../../packages/admin/src/list.css)
- エントリ: [main.tsx](../../../packages/admin/src/main.tsx)

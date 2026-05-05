# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run

```sh
sbt
> warStart      # start dev server at http://localhost:8080/
> warStop       # stop dev server
> compile       # compile only
> test          # run all tests
```

## Architecture

Scalatra (Jakarta EE) + Twirl テンプレートエンジンによるブログ。

- **ルーティング**: `BlogServlet` が `GET /` と `GET /entries/:id` を処理
- **データ**: `data/entries/*.md` に YAML フロントマター付き Markdown ファイルとして保存
- **読み込み**: `EntryRepository` が Markdown を読んで `Entry` に変換（commonmark でHTML化、snakeyaml でフロントマターをパース）
- **テンプレート**: `src/main/twirl/views/` に一覧 (`index`) と詳細 (`entry`)、共通レイアウトは `layouts/default`
- **起動**: `ScalatraBootstrap` がサーブレットをマウント、`web.xml` が `ScalatraListener` を登録

## Markdown ファイル形式

```markdown
---
title: タイトル
date: 2026-05-05
---

本文（CommonMark）
```

`title` がない場合は `_` にフォールバックする。

## テスト方針

- **スタイル**: `AnyWordSpec` + `should` を使う
- **テスト名**: `"ClassName" should "can do something"` の形式
- **フィクスチャ**: `src/test/resources/` にテスト用データを置く
- **依存性注入**: 外部リソース（ファイルシステム等）に依存するクラスはコンストラクタで注入できる設計にする（`object` ではなく `class`）
- **実装手順**: Red → Green → Refactor のサイクルで進める
  1. **Red**: フィクスチャを追加し、失敗するテストを書いて `sbt test` で RED を確認する
  2. **Green**: テストが通る最小限の実装をして `sbt test` で GREEN を確認する
  3. **Refactor**: 重複・複雑さを取り除いてコードを整理し、再度 `sbt test` で GREEN を維持する

## 開発ガイドライン

- コード編集後にbuild、testを実行する。
- Either、Optionを用いて関数の結果を型で表現する。
- 変数宣言はvalを利用し、イミュータブルなデータを扱う。
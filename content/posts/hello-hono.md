---
title: Hono JSX で SSR を始める
slug: hello-hono
published_at: 2026-10-08T00:00:00.000Z
draft: false
---

Cloudflare Workers 上で Hono の JSX を使い、サーバー側だけで HTML を返すブログの土台を用意しました。

React やクライアントバンドルは使わず、ルートごとにコンポーネントを描画します。記事は `content/posts` で管理し、`blog sync` で D1 に載せます。

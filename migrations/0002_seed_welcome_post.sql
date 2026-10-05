INSERT INTO posts (slug, title, body, status, published_at) VALUES (
  'hello-world',
  'Hello, world',
  '# はじめまして

このブログは **Next.js (vinext)** + **Cloudflare Workers** + **Cloudflare D1** で動いています。

- 記事は D1 に Markdown で保存されます
- 公開記事はトップページと `/posts/:slug` から読めます',
  'published',
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
);

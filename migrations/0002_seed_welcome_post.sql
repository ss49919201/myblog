INSERT INTO posts (slug, title, body, status, published_at) VALUES (
  'hello-world',
  'Hello, world',
  '# はじめまして

このブログは **Next.js (vinext)** + **Cloudflare Workers** + **Cloudflare D1** で動いています。

- 記事は D1 に Markdown で保存されます
- `/admin` から記事を作成・編集できます',
  'published',
  strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
);

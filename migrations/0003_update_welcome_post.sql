-- Drop the admin instructions from the original seeded welcome post.
-- Leaves a customized hello-world body untouched.
UPDATE posts
SET
  body = '# はじめまして

このブログは **Next.js (vinext)** + **Cloudflare Workers** + **Cloudflare D1** で動いています。

- 記事は D1 に Markdown で保存されます
- 公開記事はトップページと `/posts/:slug` から読めます',
  updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
WHERE slug = 'hello-world'
  AND body = '# はじめまして

このブログは **Next.js (vinext)** + **Cloudflare Workers** + **Cloudflare D1** で動いています。

- 記事は D1 に Markdown で保存されます
- `/admin` から記事を作成・編集できます';

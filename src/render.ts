import type { CategoryLink, Site, VisiblePost } from "./types.ts";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Tokyo",
});

export function homePage(site: Site, posts: readonly VisiblePost[]): string {
  return layout(site, {
    description: site.description,
    path: "/",
    ogType: "website",
    main: postList(posts),
  });
}

export function postPage(site: Site, post: VisiblePost): string {
  const category = categoryPill(post.category);
  return layout(site, {
    title: post.title,
    description: post.description,
    path: postPath(post.slug),
    ogType: "article",
    publishedAt: post.publishedAt,
    main: `<article>
      <div class="meta"><time datetime="${escapeHtml(post.publishedAt)}">${escapeHtml(formatDate(post.publishedAt))}</time>${category}</div>
      <h1>${escapeHtml(post.title)}</h1>
      <div class="prose">${post.html}</div>
    </article>`,
  });
}

export function categoryPage(site: Site, category: CategoryLink, posts: readonly VisiblePost[]): string {
  return layout(site, {
    title: category.name,
    description: `${category.name}の記事`,
    path: categoryPath(category.slug),
    ogType: "website",
    main: `<section>
      <p class="kicker">カテゴリー</p>
      <h1>${escapeHtml(category.name)}</h1>
      ${postList(posts)}
    </section>`,
  });
}

export function notFoundPage(site: Site, path: string): string {
  return layout(site, {
    title: "ページが見つかりません",
    description: "ページが見つかりません",
    path,
    ogType: "website",
    main: `<div class="not-found">
      <h1>ページが見つかりません</h1>
      <a href="/">トップへ戻る</a>
    </div>`,
  });
}

export function feedXml(site: Site, posts: readonly VisiblePost[]): string {
  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(absolute(site, postPath(post.slug)))}</link>
      <guid isPermaLink="true">${escapeXml(absolute(site, postPath(post.slug)))}</guid>
      <pubDate>${escapeXml(new Date(post.publishedAt).toUTCString())}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <description>${escapeXml(site.description)}</description>
    <link>${escapeXml(absolute(site, "/"))}</link>
    <language>ja</language>
${items}
  </channel>
</rss>
`;
}

export function sitemapXml(site: Site, categories: readonly CategoryLink[], posts: readonly VisiblePost[]): string {
  const urls = [
    loc(absolute(site, "/")),
    ...categories.map((category) => loc(absolute(site, categoryPath(category.slug)))),
    ...posts.map((post) => loc(absolute(site, postPath(post.slug)), post.publishedAt.slice(0, 10))),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`;
}

export function robotsTxt(site: Site): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${absolute(site, "/sitemap.xml")}\n`;
}

function postList(posts: readonly VisiblePost[]): string {
  if (posts.length === 0) return `<p class="empty">まだ記事がありません。</p>`;
  const items = posts
    .map((post) => {
      return `<li>
        <article>
          <div class="meta"><time datetime="${escapeHtml(post.publishedAt)}">${escapeHtml(formatDate(post.publishedAt))}</time>${categoryPill(post.category)}</div>
          <h2><a href="${escapeHtml(postPath(post.slug))}">${escapeHtml(post.title)}</a></h2>
        </article>
      </li>`;
    })
    .join("");
  return `<ul class="post-list">${items}</ul>`;
}

function categoryPill(category: CategoryLink | null): string {
  if (!category) return "";
  return `<a class="pill" href="${escapeHtml(categoryPath(category.slug))}">${escapeHtml(category.name)}</a>`;
}

function layout(
  site: Site,
  opts: {
    title?: string;
    description: string;
    path: string;
    ogType: "website" | "article";
    publishedAt?: string;
    main: string;
  },
): string {
  const pageTitle = opts.title ? `${opts.title} | ${site.name}` : site.name;
  const ogTitle = opts.title ?? site.name;
  const canonical = absolute(site, opts.path);
  const feed = absolute(site, "/feed.xml");
  const published = opts.publishedAt
    ? `\n<meta property="article:published_time" content="${escapeHtml(opts.publishedAt)}" />`
    : "";
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(pageTitle)}</title>
<meta name="description" content="${escapeHtml(opts.description)}" />
<link rel="canonical" href="${escapeHtml(canonical)}" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="alternate" type="application/rss+xml" title="${escapeHtml(site.name)}" href="${escapeHtml(feed)}" />
<link rel="stylesheet" href="/styles.css" />
<meta property="og:site_name" content="${escapeHtml(site.name)}" />
<meta property="og:title" content="${escapeHtml(ogTitle)}" />
<meta property="og:description" content="${escapeHtml(opts.description)}" />
<meta property="og:type" content="${opts.ogType}" />
<meta property="og:url" content="${escapeHtml(canonical)}" />
<meta property="og:locale" content="ja_JP" />${published}
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
<meta name="twitter:description" content="${escapeHtml(opts.description)}" />
</head>
<body>
<div class="accent-bar" aria-hidden="true"></div>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="/">${escapeHtml(site.name)}</a>
  </div>
</header>
<main class="wrap">
${opts.main}
</main>
</body>
</html>
`;
}

function loc(url: string, lastmod?: string): string {
  const modified = lastmod ? `<lastmod>${escapeXml(lastmod)}</lastmod>` : "";
  return `  <url><loc>${escapeXml(url)}</loc>${modified}</url>`;
}

function postPath(slug: string): string {
  return `/posts/${encodeURIComponent(slug)}`;
}

function categoryPath(slug: string): string {
  return `/categories/${encodeURIComponent(slug)}`;
}

function absolute(site: Site, path: string): string {
  return new URL(path, site.origin).href;
}

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function escapeXml(value: string): string {
  return escapeHtml(value);
}

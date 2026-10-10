import type { FC, PropsWithChildren } from 'hono/jsx'
import type { PageMeta } from '../meta'
import { rootCssVariables } from '../theme'
import { MetaTags } from './MetaTags'

const styles = `
  ${rootCssVariables()}
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: 'M PLUS 1p', system-ui, -apple-system, 'Segoe UI', sans-serif;
    line-height: 1.65;
    color: var(--text);
    background: var(--bg);
  }
  a { color: inherit; text-decoration-thickness: 2px; text-underline-offset: 4px; }
  a:hover { text-decoration-color: var(--accent); }
  .wrap { max-width: var(--max); margin: 0 auto; padding: 2.25rem 1.25rem 3.5rem; }
  header {
    border-bottom: 3px solid var(--accent);
    margin-bottom: 2.25rem;
    padding-bottom: 1.125rem;
  }
  .site-title {
    font-family: 'M PLUS Rounded 1c', 'M PLUS 1p', system-ui, sans-serif;
    font-size: 1.35rem;
    font-weight: 800;
    margin: 0;
    letter-spacing: 0.02em;
  }
  .site-title a { text-decoration: none; }
  .site-title a:hover { text-decoration: underline; text-decoration-color: var(--accent); }
  footer {
    margin-top: 3.5rem;
    padding-top: 1.25rem;
    border-top: 3px solid var(--accent);
    font-size: 0.875rem;
    color: var(--muted);
  }
  .page-heading {
    font-family: 'M PLUS Rounded 1c', 'M PLUS 1p', system-ui, sans-serif;
    font-size: clamp(1.5rem, 4vw, 1.85rem);
    font-weight: 800;
    margin: 0 0 1.75rem;
    line-height: 1.25;
    letter-spacing: 0.02em;
  }
  .post-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  .post-card {
    padding: 1.35rem 1.35rem 1.25rem;
    background: color-mix(in srgb, var(--accent) 12%, var(--bg));
    border: 2px solid var(--accent);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .post-card:hover {
    transform: translateY(-3px);
    box-shadow: var(--shadow-card-hover);
  }
  .post-card-title {
    font-family: 'M PLUS Rounded 1c', 'M PLUS 1p', system-ui, sans-serif;
    font-size: 1.15rem;
    font-weight: 700;
    margin: 0 0 0.65rem;
    line-height: 1.35;
  }
  .post-card-title a { text-decoration: none; }
  .post-card-title a:hover { text-decoration: underline; text-decoration-color: var(--accent); }
  .date-pill {
    display: inline-block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--muted);
    background: color-mix(in srgb, var(--accent) 28%, var(--bg));
    border: 2px solid color-mix(in srgb, var(--accent) 65%, transparent);
    border-radius: var(--radius-pill);
    padding: 0.2rem 0.75rem;
    line-height: 1.4;
  }
  .article {
    padding: 1.75rem 1.5rem 1.5rem;
    background: color-mix(in srgb, var(--accent) 12%, var(--bg));
    border: 2px solid var(--accent);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
  }
  .article-title {
    font-family: 'M PLUS Rounded 1c', 'M PLUS 1p', system-ui, sans-serif;
    font-size: clamp(1.65rem, 4.5vw, 2rem);
    font-weight: 800;
    margin: 0 0 0.85rem;
    line-height: 1.3;
    letter-spacing: 0.02em;
  }
  .article-meta { margin: 0 0 1.5rem; }
  .article-body {
    border-top: 3px solid var(--accent);
    padding-top: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }
  .article-body p { margin: 0; }
  .panel {
    padding: 1.75rem 1.5rem;
    background: color-mix(in srgb, var(--accent) 12%, var(--bg));
    border: 2px solid var(--accent);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
  }
  .panel p { margin: 0 0 1rem; }
  .panel p:last-child { margin-bottom: 0; }
  .back-link {
    display: inline-block;
    margin-top: 1.75rem;
    font-weight: 700;
    text-decoration: none;
    padding: 0.45rem 0.9rem;
    border: 2px solid var(--accent);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--accent) 22%, var(--bg));
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .back-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 0 color-mix(in srgb, var(--accent) 55%, transparent);
    text-decoration: none;
  }
  @media (prefers-reduced-motion: reduce) {
    .post-card,
    .back-link {
      transition: none;
    }
    .post-card:hover,
    .back-link:hover {
      transform: none;
    }
  }
`

type LayoutProps = PropsWithChildren<{
  title: string
  meta: PageMeta
}>

export const Layout: FC<LayoutProps> = ({ title, meta, children }) => (
  <html lang="ja">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="description" content={meta.description} />
      <title>{title}</title>
      <MetaTags meta={meta} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=M+PLUS+1p:wght@400;600;700&family=M+PLUS+Rounded+1c:wght@700;800&display=swap"
        rel="stylesheet"
      />
      <style>{styles}</style>
    </head>
    <body>
      <div class="wrap">
        <header>
          <p class="site-title">
            <a href="/">myblog</a>
          </p>
        </header>
        <main>{children}</main>
        <footer>SSR with Hono JSX on Cloudflare Workers</footer>
      </div>
    </body>
  </html>
)

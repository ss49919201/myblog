import type { FC, PropsWithChildren } from 'hono/jsx'

const styles = `
  :root {
    color-scheme: light;
    --text: #1f2937;
    --muted: #6b7280;
    --bg: #fafafa;
    --accent: #c4b5fd;
    --max: 42rem;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    line-height: 1.65;
    color: var(--text);
    background: var(--bg);
  }
  a { color: inherit; text-decoration-thickness: 1px; text-underline-offset: 3px; }
  a:hover { text-decoration-color: var(--accent); }
  .wrap { max-width: var(--max); margin: 0 auto; padding: 2rem 1.25rem 3rem; }
  header {
    border-bottom: 1px solid var(--accent);
    margin-bottom: 2rem;
    padding-bottom: 1rem;
  }
  .site-title { font-size: 1.125rem; font-weight: 600; margin: 0; }
  .site-title a { text-decoration: none; }
  footer {
    margin-top: 3rem;
    padding-top: 1rem;
    border-top: 1px solid var(--accent);
    font-size: 0.875rem;
    color: var(--muted);
  }
`

type LayoutProps = PropsWithChildren<{
  title: string
}>

export const Layout: FC<LayoutProps> = ({ title, children }) => (
  <html lang="ja">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
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

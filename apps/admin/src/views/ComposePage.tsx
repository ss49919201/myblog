import type { FC } from 'hono/jsx'
import { rootCssVariables, SITE_NAME } from '../theme'

const styles = `
  ${rootCssVariables()}
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: var(--text);
    background: var(--bg);
  }
  .wrap {
    max-width: var(--max);
    margin: 0 auto;
    padding: 1.25rem 1rem 2.5rem;
  }
  header {
    border-bottom: 3px solid var(--accent);
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
  }
  h1 {
    font-size: 1.25rem;
    font-weight: 800;
    margin: 0;
  }
  .panel {
    padding: 1.25rem 1rem;
    background: color-mix(in srgb, var(--accent) 12%, var(--bg));
    border: 2px solid var(--accent);
    border-radius: var(--radius-lg);
  }
  label {
    display: block;
    font-weight: 700;
    font-size: 0.9rem;
    margin-bottom: 0.35rem;
  }
  .field { margin-bottom: 1.1rem; }
  input[type="text"],
  textarea {
    width: 100%;
    font: inherit;
    padding: 0.65rem 0.75rem;
    border: 2px solid color-mix(in srgb, var(--accent) 65%, transparent);
    border-radius: var(--radius-md);
    background: var(--bg);
  }
  textarea {
    min-height: 14rem;
    resize: vertical;
  }
  button[type="submit"] {
    width: 100%;
    font: inherit;
    font-weight: 700;
    padding: 0.75rem 1rem;
    border: 2px solid var(--accent);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--accent) 35%, var(--bg));
    cursor: pointer;
  }
  .error {
    margin-bottom: 1rem;
    padding: 0.75rem 0.85rem;
    border: 2px solid #f87171;
    border-radius: var(--radius-md);
    background: #fef2f2;
    color: #991b1b;
    font-size: 0.9rem;
  }
  .success {
    margin-bottom: 1rem;
    padding: 0.75rem 0.85rem;
    border: 2px solid var(--accent);
    border-radius: var(--radius-md);
    background: color-mix(in srgb, var(--accent) 22%, var(--bg));
    font-size: 0.9rem;
  }
  .success a {
    font-weight: 700;
    word-break: break-all;
  }
  .hint {
    margin-top: 0.75rem;
    font-size: 0.8rem;
    color: var(--muted);
  }
`

export type ComposePageProps = {
  title?: string
  bodyMd?: string
  errorMessage?: string
  publishedUrl?: string
}

export const ComposePage: FC<ComposePageProps> = ({
  title = '',
  bodyMd = '',
  errorMessage,
  publishedUrl,
}) => (
  <html lang="ja">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>新規入稿 | {SITE_NAME}</title>
      <style>{styles}</style>
    </head>
    <body>
      <div class="wrap">
        <header>
          <h1>{SITE_NAME}</h1>
        </header>
        <div class="panel">
          {errorMessage ? <div class="error">{errorMessage}</div> : null}
          {publishedUrl ? (
            <div class="success">
              公開しました。
              <a href={publishedUrl}>{publishedUrl}</a>
            </div>
          ) : null}
          <form method="post" action="/">
            <div class="field">
              <label for="title">タイトル</label>
              <input
                id="title"
                name="title"
                type="text"
                required
                autocomplete="off"
                value={title}
              />
            </div>
            <div class="field">
              <label for="body_md">本文（Markdown）</label>
              <textarea id="body_md" name="body_md" required>{bodyMd}</textarea>
            </div>
            <button type="submit">公開する</button>
          </form>
          <p class="hint">slug は自動生成されます。公開日時は送信時刻です。</p>
        </div>
      </div>
    </body>
  </html>
)

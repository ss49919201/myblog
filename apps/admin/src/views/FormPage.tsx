import { layout, palette, rootCssVariables } from '../theme'

export type FormPageProps = {
  csrfToken: string
  title: string
  body: string
  errorMessage?: string
  successUrl?: string
}

export function FormPage({
  csrfToken,
  title,
  body,
  errorMessage,
  successUrl,
}: FormPageProps) {
  return (
    <html lang="ja">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>記事を入稿 | myblog admin</title>
        <style>{`${rootCssVariables()}
          * { box-sizing: border-box; }
          body {
            margin: 0;
            min-height: 100dvh;
            font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            padding: 1rem 1rem 2.5rem;
          }
          main {
            max-width: var(--max);
            margin: 0 auto;
          }
          h1 {
            font-size: 1.35rem;
            margin: 0 0 1.25rem;
            padding-bottom: 0.5rem;
            border-bottom: 3px solid color-mix(in srgb, var(--accent) 65%, transparent);
          }
          label {
            display: block;
            font-weight: 600;
            font-size: 0.95rem;
            margin-bottom: 0.35rem;
          }
          .field { margin-bottom: 1.25rem; }
          input[type="text"],
          textarea {
            width: 100%;
            font: inherit;
            padding: 0.75rem 0.85rem;
            border: 1px solid color-mix(in srgb, var(--text) 18%, transparent);
            border-radius: var(--radius-md);
            background: #fff;
          }
          textarea {
            min-height: 14rem;
            resize: vertical;
          }
          input:focus, textarea:focus {
            outline: 2px solid color-mix(in srgb, var(--accent) 80%, transparent);
            outline-offset: 1px;
          }
          .hint {
            font-size: 0.85rem;
            color: var(--muted);
            margin-top: 0.35rem;
          }
          button[type="submit"] {
            width: 100%;
            font: inherit;
            font-weight: 700;
            padding: 0.9rem 1rem;
            border: none;
            border-radius: var(--radius-md);
            background: ${palette.accent};
            color: var(--text);
            cursor: pointer;
            box-shadow: 0 3px 0 color-mix(in srgb, var(--accent) 45%, var(--text));
          }
          button[type="submit"]:active {
            transform: translateY(1px);
          }
          .alert {
            padding: 0.85rem 1rem;
            border-radius: var(--radius-md);
            margin-bottom: 1rem;
            font-size: 0.95rem;
          }
          .alert-error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #991b1b;
          }
          .alert-success {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #166534;
          }
          .alert-success a {
            color: inherit;
            font-weight: 700;
            word-break: break-all;
          }
        `}</style>
      </head>
      <body>
        <main>
          <h1>記事を入稿</h1>
          {successUrl !== undefined ? (
            <div class="alert alert-success" role="status">
              公開しました。
              <a href={successUrl}>{successUrl}</a>
            </div>
          ) : null}
          {errorMessage !== undefined ? (
            <div class="alert alert-error" role="alert">{errorMessage}</div>
          ) : null}
          <form method="post" action="/">
            <input type="hidden" name="csrf_token" value={csrfToken} />
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
              <label for="body">本文（Markdown）</label>
              <textarea
                id="body"
                name="body"
                required
                spellCheck={true}
              >{body}</textarea>
              <p class="hint">見出しやリストなど GitHub 風 Markdown が使えます。</p>
            </div>
            <button type="submit">公開する</button>
          </form>
        </main>
      </body>
    </html>
  )
}

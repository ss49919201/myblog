import { SITE_TITLE_MAX_LENGTH } from '../domain/site-title'

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export const settingsBasicClientScript = `(() => {
  const form = document.querySelector('form[data-settings-basic]')
  if (!(form instanceof HTMLFormElement)) return

  const input = form.querySelector('#site_title')
  const counter = form.querySelector('[data-title-counter]')
  const maxLength = Number(form.dataset.maxLength)
  if (!(input instanceof HTMLInputElement) || !(counter instanceof HTMLOutputElement)) {
    return
  }
  if (!Number.isFinite(maxLength)) return

  const syncCounter = () => {
    counter.textContent = String(input.value.length)
  }

  input.addEventListener('input', syncCounter)
  syncCounter()

  form.addEventListener('submit', (event) => {
    const trimmed = input.value.trim()
    if (trimmed.length === 0 || trimmed.length > maxLength) {
      event.preventDefault()
      input.focus()
    }
  })
})()
`

export type SettingsBasicPageModel = {
  siteTitle: string
  errorMessage?: string
  savedMessage?: string
}

export function renderSettingsBasicPage(model: SettingsBasicPageModel): string {
  const siteTitle = escapeHtml(model.siteTitle)
  const maxLength = SITE_TITLE_MAX_LENGTH
  const errorBlock = model.errorMessage
    ? `<p class="error" role="alert">${escapeHtml(model.errorMessage)}</p>`
    : ''
  const savedBlock = model.savedMessage
    ? `<p class="success" role="status">${escapeHtml(model.savedMessage)}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>基本設定 | blog 入稿</title>
    <style>
      :root {
        --bg: #fafafa;
        --text: #1a1a1a;
        --muted: #525252;
        --accent: #c4b5fd;
        --max: 42rem;
        --radius-lg: 12px;
        --radius-md: 8px;
      }
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
        margin: 0 0 0.75rem;
      }
      nav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem 1.25rem;
      }
      nav a {
        color: inherit;
        font-weight: 700;
        text-decoration-thickness: 2px;
        text-underline-offset: 3px;
      }
      nav a[aria-current="page"] {
        text-decoration: none;
        border-bottom: 3px solid var(--accent);
      }
      .panel {
        padding: 1.25rem 1rem;
        background: color-mix(in srgb, var(--accent) 12%, var(--bg));
        border: 2px solid var(--accent);
        border-radius: var(--radius-lg);
      }
      h2 {
        font-size: 1.05rem;
        margin: 0 0 1rem;
      }
      label {
        display: block;
        font-weight: 700;
        font-size: 0.9rem;
        margin-bottom: 0.35rem;
      }
      input[type="text"] {
        width: 100%;
        font: inherit;
        padding: 0.65rem 0.75rem;
        border: 2px solid color-mix(in srgb, var(--accent) 65%, transparent);
        border-radius: var(--radius-md);
        background: var(--bg);
      }
      .field-hint {
        margin: 0.35rem 0 0;
        font-size: 0.8rem;
        color: var(--muted);
      }
      button[type="submit"] {
        margin-top: 1.1rem;
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
        margin: 0 0 1rem;
        padding: 0.75rem 0.85rem;
        border: 2px solid #f87171;
        border-radius: var(--radius-md);
        background: #fef2f2;
        color: #991b1b;
        font-size: 0.9rem;
      }
      .success {
        margin: 0 0 1rem;
        padding: 0.75rem 0.85rem;
        border: 2px solid var(--accent);
        border-radius: var(--radius-md);
        background: color-mix(in srgb, var(--accent) 22%, var(--bg));
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        <h1>blog 入稿</h1>
        <nav aria-label="管理メニュー">
          <a href="/">新規入稿</a>
          <a href="/settings/basic" aria-current="page">基本設定</a>
        </nav>
      </header>
      <main>
        <section class="panel">
          <h2>ブログタイトル</h2>
          ${errorBlock}
          ${savedBlock}
          <form
            method="post"
            action="/settings/basic"
            data-settings-basic=""
            data-max-length="${maxLength}"
          >
            <label for="site_title">表示名</label>
            <input
              id="site_title"
              name="site_title"
              type="text"
              required
              maxlength="${maxLength}"
              autocomplete="organization"
              value="${siteTitle}"
            />
            <p class="field-hint">
              公開サイトのヘッダーとページタイトルに使われます。
              <output data-title-counter="" for="site_title">0</output> / ${maxLength} 文字
            </p>
            <button type="submit">保存する</button>
          </form>
        </section>
      </main>
    </div>
    <script src="/settings/basic.js" defer></script>
  </body>
</html>`
}

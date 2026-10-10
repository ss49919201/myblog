export const SITE_NAME = 'myblog'

export const palette = {
  text: '#1f2937',
  muted: '#6b7280',
  bg: '#fafafa',
  accent: '#c4b5fd',
} as const

export const layout = {
  max: '42rem',
  radiusLg: '1rem',
  radiusMd: '0.625rem',
  radiusPill: '999px',
} as const

export const ogImage = {
  width: 1200,
  height: 630,
  borderPx: 16,
  paddingPx: 48,
  titleFontSizePx: 56,
  titleLineHeight: 1.35,
  titleMaxLines: 3,
  siteLabelFontSizePx: 28,
} as const

export function rootCssVariables(): string {
  return `
  :root {
    color-scheme: light;
    --text: ${palette.text};
    --muted: ${palette.muted};
    --bg: ${palette.bg};
    --accent: ${palette.accent};
    --max: ${layout.max};
    --radius-lg: ${layout.radiusLg};
    --radius-md: ${layout.radiusMd};
    --radius-pill: ${layout.radiusPill};
    --shadow-card: 0 4px 0 color-mix(in srgb, var(--accent) 55%, transparent),
      0 10px 24px color-mix(in srgb, var(--text) 8%, transparent);
    --shadow-card-hover: 0 6px 0 color-mix(in srgb, var(--accent) 70%, transparent),
      0 16px 32px color-mix(in srgb, var(--text) 12%, transparent);
  }`
}

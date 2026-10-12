export const SITE_NAME = 'myblog 入稿'

export const palette = {
  text: '#1f2937',
  muted: '#6b7280',
  bg: '#fafafa',
  accent: '#c4b5fd',
} as const

export function rootCssVariables(): string {
  return `
  :root {
    color-scheme: light;
    --text: ${palette.text};
    --muted: ${palette.muted};
    --bg: ${palette.bg};
    --accent: ${palette.accent};
    --max: 36rem;
    --radius-lg: 1rem;
    --radius-md: 0.625rem;
  }`
}

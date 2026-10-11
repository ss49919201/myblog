export const palette = {
  text: '#1f2937',
  muted: '#6b7280',
  bg: '#fafafa',
  accent: '#c4b5fd',
} as const

export const layout = {
  max: '42rem',
  radiusMd: '0.625rem',
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
    --radius-md: ${layout.radiusMd};
  }`
}

import notoSansJpBoldUrl from '@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff?url'

export const ogFontFamily = 'Noto Sans JP'

type OgFont = {
  name: string
  data: ArrayBuffer
  weight: number
  style: 'normal' | 'italic'
}

let cachedFonts: OgFont[] | undefined

export async function getOgFonts(
  assetBaseUrl: string,
): Promise<readonly OgFont[]> {
  if (cachedFonts) {
    return cachedFonts
  }
  const fontUrl = new URL(notoSansJpBoldUrl, assetBaseUrl).href
  const response = await fetch(fontUrl)
  if (!response.ok) {
    throw new Error(`failed to load OG font (${response.status})`)
  }
  const data = await response.arrayBuffer()
  cachedFonts = [
    {
      name: ogFontFamily,
      data,
      weight: 700,
      style: 'normal',
    },
  ]
  return cachedFonts
}

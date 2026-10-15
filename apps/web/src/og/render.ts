import { ImageResponse } from 'workers-og'
import { ogImage } from '../theme'
import { getOgFonts } from './fonts'
import { postOgHtml, siteOgHtml } from './templates'

export async function renderSiteOgPng(): Promise<Response> {
  const fonts = await getOgFonts()
  return new ImageResponse(siteOgHtml(), {
    width: ogImage.width,
    height: ogImage.height,
    fonts: [...fonts],
  })
}

export async function renderPostOgPng(title: string): Promise<Response> {
  const fonts = await getOgFonts()
  return new ImageResponse(postOgHtml(title), {
    width: ogImage.width,
    height: ogImage.height,
    fonts: [...fonts],
  })
}

import { ImageResponse } from 'workers-og'
import { ogImage } from '../theme'
import { ogFonts } from './fonts'
import { postOgHtml, siteOgHtml } from './templates'

export async function renderSiteOgPng(): Promise<Response> {
  return new ImageResponse(siteOgHtml(), {
    width: ogImage.width,
    height: ogImage.height,
    fonts: [...ogFonts],
  })
}

export async function renderPostOgPng(title: string): Promise<Response> {
  return new ImageResponse(postOgHtml(title), {
    width: ogImage.width,
    height: ogImage.height,
    fonts: [...ogFonts],
  })
}

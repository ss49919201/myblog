import { ogImage, palette } from '../theme'
import { escapeHtml } from './escape-html'
import { ogFontFamily } from './fonts'

const titleBlockHeight =
  ogImage.titleFontSizePx *
  ogImage.titleLineHeight *
  ogImage.titleMaxLines

function outerFrameStyle(): string {
  return [
    'display: flex',
    `width: ${ogImage.width}px`,
    `height: ${ogImage.height}px`,
    `border: ${ogImage.borderPx}px solid ${palette.accent}`,
    `background: ${palette.accent}`,
    'box-sizing: border-box',
    `font-family: '${ogFontFamily}'`,
    `color: ${palette.text}`,
  ].join('; ')
}

function innerSurfaceStyle(): string {
  return [
    'display: flex',
    'flex-direction: column',
    'flex: 1',
    'min-height: 0',
    'min-width: 0',
    `background: ${palette.bg}`,
    `border-radius: ${ogImage.innerRadiusPx}px`,
    `padding: ${ogImage.paddingPx}px`,
    'box-sizing: border-box',
  ].join('; ')
}

export function siteOgHtml(siteTitle: string): string {
  return `
    <div style="${outerFrameStyle()}">
      <div style="${innerSurfaceStyle()}">
      <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
        <p style="margin: 0; font-size: 72px; font-weight: 700; letter-spacing: 0.02em;">
          ${escapeHtml(siteTitle)}
        </p>
      </div>
      </div>
    </div>
  `
}

export function postOgHtml(title: string, siteTitle: string): string {
  const safeTitle = escapeHtml(title)
  return `
    <div style="${outerFrameStyle()}">
      <div style="${innerSurfaceStyle()}">
      <div style="flex: 1; display: flex; align-items: center; justify-content: center; min-height: 0;">
        <h1 style="
          margin: 0;
          width: 100%;
          font-size: ${ogImage.titleFontSizePx}px;
          font-weight: 700;
          line-height: ${ogImage.titleLineHeight};
          max-height: ${titleBlockHeight}px;
          overflow: hidden;
          letter-spacing: 0.02em;
          text-align: left;
        ">${safeTitle}</h1>
      </div>
      <p style="
        margin: 0;
        font-size: ${ogImage.siteLabelFontSizePx}px;
        font-weight: 700;
        color: ${palette.muted};
      ">${escapeHtml(siteTitle)}</p>
      </div>
    </div>
  `
}

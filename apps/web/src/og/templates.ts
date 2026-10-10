import { ogImage, palette, SITE_NAME } from '../theme'
import { escapeHtml } from './escape-html'
import { ogFontFamily } from './fonts'

const titleBlockHeight =
  ogImage.titleFontSizePx *
  ogImage.titleLineHeight *
  ogImage.titleMaxLines

function frameStyle(): string {
  return [
    'display: flex',
    'flex-direction: column',
    `width: ${ogImage.width}px`,
    `height: ${ogImage.height}px`,
    `background: ${palette.bg}`,
    `border: ${ogImage.borderPx}px solid ${palette.accent}`,
    `padding: ${ogImage.paddingPx}px`,
    'box-sizing: border-box',
    `font-family: '${ogFontFamily}'`,
    `color: ${palette.text}`,
  ].join('; ')
}

export function siteOgHtml(): string {
  return `
    <div style="${frameStyle()}">
      <div style="flex: 1; display: flex; align-items: center; justify-content: center;">
        <p style="margin: 0; font-size: 72px; font-weight: 700; letter-spacing: 0.02em;">
          ${escapeHtml(SITE_NAME)}
        </p>
      </div>
    </div>
  `
}

export function postOgHtml(title: string): string {
  const safeTitle = escapeHtml(title)
  return `
    <div style="${frameStyle()}">
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
      ">${escapeHtml(SITE_NAME)}</p>
    </div>
  `
}

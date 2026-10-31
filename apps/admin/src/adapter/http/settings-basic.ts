import { vValidator } from '@hono/valibot-validator'
import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import * as v from 'valibot'
import { updateSiteTitle } from '../../application/update-site-title'
import {
  SITE_TITLE_MAX_LENGTH,
  updateSiteTitleInputSchema,
} from '../../domain/site-title'
import type { Env } from '../../env'
import { createD1SiteSettingsRepository } from '../persistence/d1-site-settings-repository'
import {
  renderSettingsBasicPage,
  settingsBasicClientScript,
} from '../../views/settings-basic-page'

const DEFAULT_SITE_TITLE = 'blog'

export function registerSettingsBasicRoutes(app: Hono<{ Bindings: Env }>): void {
  app.get('/settings/basic.js', (c) =>
    c.body(settingsBasicClientScript, 200, {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store',
    }),
  )

  app.get('/settings/basic', async (c) => {
    const repo = createD1SiteSettingsRepository(c.env.DB)
    const current = (await repo.getSiteTitle()) ?? DEFAULT_SITE_TITLE
    return c.html(renderSettingsBasicPage({ siteTitle: current }))
  })

  app.post(
    '/settings/basic',
    csrf(),
    vValidator(
      'form',
      v.object({
        site_title: v.pipe(
          v.string(),
          v.maxLength(
            SITE_TITLE_MAX_LENGTH,
            `ブログタイトルは ${SITE_TITLE_MAX_LENGTH} 文字以内にしてください。`,
          ),
        ),
      }),
      (result, c) => {
        if (!result.success) {
          const siteTitle = result.typed ? result.output.site_title : ''
          return c.html(
            renderSettingsBasicPage({
              siteTitle,
              errorMessage: result.issues[0]?.message,
            }),
          )
        }
      },
    ),
    async (c) => {
      const { site_title: rawTitle } = c.req.valid('form')
      const parsed = v.safeParse(updateSiteTitleInputSchema, {
        siteTitle: rawTitle,
      })
      if (!parsed.success) {
        return c.html(
          renderSettingsBasicPage({
            siteTitle: rawTitle,
            errorMessage: parsed.issues[0]?.message,
          }),
        )
      }

      const result = await updateSiteTitle(
        { settings: createD1SiteSettingsRepository(c.env.DB) },
        parsed.output,
      )

      return result.match(
        () =>
          c.html(
            renderSettingsBasicPage({
              siteTitle: parsed.output.siteTitle,
              savedMessage: '保存しました。',
            }),
          ),
        () =>
          c.html(
            renderSettingsBasicPage({
              siteTitle: rawTitle,
              errorMessage:
                '保存に失敗しました。しばらくしてから再度お試しください。',
            }),
          ),
      )
    },
  )
}

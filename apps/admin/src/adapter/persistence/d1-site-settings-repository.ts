import * as v from 'valibot'
import type { SiteTitle } from '../../domain/site-title'
import { siteTitleSchema } from '../../domain/site-title'
import type { SiteSettingsRepository } from '../../port/site-settings-repository'

const SETTINGS_ROW_ID = 1

export function createD1SiteSettingsRepository(
  db: D1Database,
): SiteSettingsRepository {
  return {
    async getSiteTitle(): Promise<SiteTitle | null> {
      const row = await db
        .prepare('SELECT site_title AS siteTitle FROM site_settings WHERE id = ?')
        .bind(SETTINGS_ROW_ID)
        .first<{ siteTitle: string }>()
      if (!row) return null
      const parsed = v.safeParse(siteTitleSchema, row.siteTitle)
      return parsed.success ? parsed.output : null
    },

    async saveSiteTitle(siteTitle: SiteTitle): Promise<void> {
      await db
        .prepare(
          `INSERT INTO site_settings (id, site_title) VALUES (?, ?)
           ON CONFLICT(id) DO UPDATE SET site_title = excluded.site_title`,
        )
        .bind(SETTINGS_ROW_ID, siteTitle)
        .run()
    },
  }
}

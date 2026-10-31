import type { SiteTitle } from '../domain/site-title'

export type SiteSettingsRepository = {
  getSiteTitle(): Promise<SiteTitle | null>
  saveSiteTitle(siteTitle: SiteTitle): Promise<void>
}

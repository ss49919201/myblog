import { getSiteTitle } from '../site-settings/repository'
import { DEFAULT_SITE_TITLE } from '../site-settings/default'

export async function resolveSiteTitle(db: D1Database): Promise<string> {
  const result = await getSiteTitle(db)
  return result.match(
    (siteTitle) => siteTitle,
    () => DEFAULT_SITE_TITLE,
  )
}

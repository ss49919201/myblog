import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import type { UpdateSiteTitleInput } from '../domain/site-title'
import type { SiteSettingsRepository } from '../port/site-settings-repository'

export type UpdateSiteTitleError = { type: 'StorageError'; cause: unknown }

export function updateSiteTitle(
  deps: { settings: SiteSettingsRepository },
  input: UpdateSiteTitleInput,
): ResultAsync<void, UpdateSiteTitleError> {
  return ResultAsync.fromPromise(
    deps.settings.saveSiteTitle(input.siteTitle),
    (cause): UpdateSiteTitleError => ({ type: 'StorageError', cause }),
  ).andThen(() => okAsync(undefined))
}

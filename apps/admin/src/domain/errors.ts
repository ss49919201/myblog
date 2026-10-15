export type SubmitError =
  | { type: 'SlugConflict'; slug: string }
  | { type: 'StorageError'; cause: unknown }

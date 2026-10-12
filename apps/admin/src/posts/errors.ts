export type SubmitError =
  | { type: 'ValidationError'; message: string }
  | { type: 'SlugConflict'; slug: string }
  | { type: 'StorageError'; cause: unknown }

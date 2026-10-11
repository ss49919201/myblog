export type AdminError =
  | { type: 'ValidationError'; field: 'title' | 'body'; message: string }
  | { type: 'StorageError'; cause: unknown }
  | { type: 'SlugConflict'; slug: string }
  | { type: 'MarkdownError'; cause: unknown }

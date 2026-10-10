export type PostsError =
  | { type: 'NotFound'; slug: string }
  | { type: 'StorageError'; cause: unknown }

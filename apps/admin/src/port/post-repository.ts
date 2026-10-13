export type PostRecord = {
  slug: string
  title: string
  publishedAt: Date
  bodyHtml: string
  bodyMd: string
}

export type PostRepository = {
  slugExists(slug: string): Promise<boolean>
  insert(post: PostRecord): Promise<void>
}

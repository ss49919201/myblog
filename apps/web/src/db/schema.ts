export interface PostsTable {
  slug: string
  title: string
  published_at: string
  body_html: string
  body_md: string
}

export interface Database {
  posts: PostsTable
}

import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const posts = sqliteTable('posts', {
  slug: text('slug').primaryKey().notNull(),
  title: text('title').notNull(),
  publishedAt: text('published_at').notNull(),
  bodyHtml: text('body_html').notNull(),
  bodyMd: text('body_md').notNull().default(''),
})

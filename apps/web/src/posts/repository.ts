import { mockPosts } from './mock-data'
import type { Post } from './types'

export function listPosts(): Post[] {
  return [...mockPosts].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
  )
}

export function getPost(slug: string): Post | undefined {
  return mockPosts.find((post) => post.slug === slug)
}

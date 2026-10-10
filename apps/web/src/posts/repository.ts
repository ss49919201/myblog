import { err, ok, type Result } from 'neverthrow'
import { mockPosts } from './mock-data'
import type { PostsError } from './errors'
import type { Post } from './types'

export function listPosts(): Result<Post[], PostsError> {
  try {
    const posts = [...mockPosts].sort(
      (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
    )
    return ok(posts)
  } catch (cause) {
    return err({ type: 'StorageError', cause })
  }
}

export function getPost(slug: string): Result<Post, PostsError> {
  try {
    const post = mockPosts.find((item) => item.slug === slug)
    if (!post) {
      return err({ type: 'NotFound', slug })
    }
    return ok(post)
  } catch (cause) {
    return err({ type: 'StorageError', cause })
  }
}

import { describe, expect, it } from 'vitest'
import { submitPost } from '../../src/application/submit-post'
import type { MarkdownRenderer } from '../../src/port/markdown-renderer'
import type { PostRecord, PostRepository } from '../../src/port/post-repository'

function fakeMarkdown(html: string): MarkdownRenderer {
  return {
    render: () => html,
  }
}

function fakePosts(
  exists: Set<string>,
  inserted: PostRecord[],
): PostRepository {
  return {
    async slugExists(slug: string): Promise<boolean> {
      return exists.has(slug)
    },
    async insert(post: PostRecord): Promise<void> {
      inserted.push(post)
    },
  }
}

describe('submitPost', () => {
  const publishedAt = new Date('2026-10-12T12:00:00.000Z')

  it('inserts a new post with rendered html', async () => {
    const inserted: PostRecord[] = []
    const result = await submitPost(
      {
        posts: fakePosts(new Set(), inserted),
        markdown: fakeMarkdown('<p>hi</p>'),
      },
      {
        title: 'Hello',
        bodyMd: 'hi',
        publishedAt,
      },
    )

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.slug).toBe('Hello')
      expect(result.value.bodyHtml).toBe('<p>hi</p>')
    }
    expect(inserted).toHaveLength(1)
    expect(inserted[0]?.bodyMd).toBe('hi')
  })

  it('picks a suffixed slug when base exists', async () => {
    const inserted: PostRecord[] = []
    const result = await submitPost(
      {
        posts: fakePosts(new Set(['Hello']), inserted),
        markdown: fakeMarkdown(''),
      },
      {
        title: 'Hello',
        bodyMd: 'body',
        publishedAt,
      },
    )

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.slug).toBe('Hello-2')
    }
  })

  it('returns validation error for empty fields', async () => {
    const result = await submitPost(
      {
        posts: fakePosts(new Set(), []),
        markdown: fakeMarkdown(''),
      },
      {
        title: '',
        bodyMd: '',
        publishedAt,
      },
    )

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('ValidationError')
    }
  })
})

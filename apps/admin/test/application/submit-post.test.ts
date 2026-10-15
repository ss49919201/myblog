import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import { submitPost } from '../../src/application/submit-post'
import { submitPostInputSchema } from '../../src/domain/validate-submit-input'
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
      v.parse(submitPostInputSchema, {
        title: 'Hello',
        bodyMd: 'hi',
        publishedAt,
      }),
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
      v.parse(submitPostInputSchema, {
        title: 'Hello',
        bodyMd: 'body',
        publishedAt,
      }),
    )

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.slug).toBe('Hello-2')
    }
  })

  it('accepts whitespace-only title as non-empty input', async () => {
    const inserted: PostRecord[] = []
    const result = await submitPost(
      {
        posts: fakePosts(new Set(), inserted),
        markdown: fakeMarkdown(''),
      },
      v.parse(submitPostInputSchema, {
        title: '   ',
        bodyMd: 'body',
        publishedAt,
      }),
    )

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.slug).toBe('-')
      expect(inserted[0]?.title).toBe('   ')
    }
  })
})

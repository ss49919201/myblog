import { describe, expect, it, vi } from 'vitest'
import type { Octokit } from '@octokit/rest'
import { ingestPostViaGitHub } from '../src/github/client'
import { renderPostMarkdown } from '../src/domain/post'

describe('ingestPostViaGitHub', () => {
  const config = { token: 't', owner: 'o', repo: 'r' }
  const draft = {
    title: 'T',
    slug: 'new-post',
    publishedAt: new Date('2026-10-11T00:00:00.000Z'),
    body: 'Body',
  }

  it('opens a PR when slug is free', async () => {
    const getContent = vi.fn().mockRejectedValue({ status: 404 })
    const getBranch = vi.fn().mockResolvedValue({
      data: { commit: { sha: 'sha-main' } },
    })
    const createRef = vi.fn().mockResolvedValue({})
    const createOrUpdateFileContents = vi.fn().mockResolvedValue({})
    const createPull = vi.fn().mockResolvedValue({
      data: { number: 42, html_url: 'https://github.com/o/r/pull/42' },
    })

    const octokit = {
      repos: {
        getContent,
        getBranch,
        createOrUpdateFileContents,
      },
      git: { createRef },
      pulls: { create: createPull },
    } as unknown as Octokit

    const result = await ingestPostViaGitHub(
      octokit,
      config,
      draft,
      'mail-ingest/new-post-deadbeef',
    )

    expect(result.isOk()).toBe(true)
    expect(result._unsafeUnwrap().pullNumber).toBe(42)
    expect(createOrUpdateFileContents).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'content/posts/new-post.md',
        branch: 'mail-ingest/new-post-deadbeef',
        content: btoa(unescape(encodeURIComponent(renderPostMarkdown(draft)))),
      }),
    )
  })

  it('rejects slug collision on main', async () => {
    const getContent = vi.fn().mockResolvedValue({ data: { sha: 'existing' } })
    const octokit = {
      repos: { getContent },
    } as unknown as Octokit

    const result = await ingestPostViaGitHub(octokit, config, draft, 'branch')
    expect(result.isErr()).toBe(true)
    expect(result._unsafeUnwrapErr().type).toBe('SlugCollision')
  })
})

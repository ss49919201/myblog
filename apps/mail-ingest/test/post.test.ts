import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  buildPostDraft,
  generateSlug,
  renderPostMarkdown,
  splitLeadingFrontmatter,
  slugFromFrontmatterYaml,
  validateSlug,
} from '../src/domain/post'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

describe('slug', () => {
  it('uses frontmatter slug when present', () => {
    const body = `---\nslug: my-custom-slug\ntitle: ignored\n---\n\nHello`
    const { frontmatter, body: rest } = splitLeadingFrontmatter(body)
    expect(frontmatter).toContain('my-custom-slug')
    expect(slugFromFrontmatterYaml(frontmatter!)).toBe('my-custom-slug')
    const draft = buildPostDraft({
      subject: 'Mail title',
      plainBody: body,
      receivedAt: new Date('2026-10-11T12:00:00.000Z'),
      idSeed: 'abc',
    })
    expect(draft._unsafeUnwrap().slug).toBe('my-custom-slug')
    expect(rest.trim()).toBe('Hello')
  })

  it('generates dated slug without frontmatter', () => {
    const slug = generateSlug(new Date('2026-10-11T08:00:00.000Z'), 'uuid-1')
    expect(slug).toBe('20261011-uuid1')
  })

  it('rejects invalid slugs', () => {
    expect(validateSlug('../bad').isErr()).toBe(true)
    expect(validateSlug('ok-slug').isOk()).toBe(true)
  })
})

describe('frontmatter output', () => {
  it('renders stable markdown shape', () => {
    const md = renderPostMarkdown({
      title: 'テスト入稿',
      slug: 'mail-ingest-test-fixture',
      publishedAt: new Date('2026-10-11T08:00:00.000Z'),
      body: '本文です。',
    })
    expect(md).toBe(
      `---\ntitle: テスト入稿\nslug: mail-ingest-test-fixture\npublished_at: 2026-10-11T08:00:00.000Z\n---\n\n本文です。`,
    )
  })

  it('passes blog check when Go runs (CI)', () => {
    if (process.env.CI !== 'true') {
      return
    }
    const md = renderPostMarkdown({
      title: 'テスト入稿',
      slug: 'mail-ingest-test-fixture',
      publishedAt: new Date('2026-10-11T08:00:00.000Z'),
      body: '本文です。',
    })
    const tmp = path.join(repoRoot, 'content/posts/mail-ingest-test-fixture.md')
    fs.writeFileSync(tmp, md)
    try {
      execFileSync('go', ['run', './cmd/blog', 'check'], {
        cwd: path.join(repoRoot, 'tools'),
        encoding: 'utf8',
      })
    } finally {
      fs.unlinkSync(tmp)
    }
  })
})

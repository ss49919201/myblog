import { describe, expect, it } from 'vitest'
import { isValidSlug, slugFromTitle, slugWithSuffix } from '../src/posts/slug'

describe('slugFromTitle', () => {
  const now = new Date('2026-10-12T12:00:00.000Z')

  it('uses trimmed title with spaces collapsed', () => {
    expect(slugFromTitle('  Hello   world  ', now)).toBe('Hello-world')
  })

  it('allows Japanese slugs', () => {
    expect(slugFromTitle('公開の話', now)).toBe('公開の話')
  })

  it('falls back to timestamp when title is only invalid slug chars', () => {
    expect(slugFromTitle('..', now)).toBe('post-2026-10-12T12-00-00')
  })

  it('suffix helper appends counter', () => {
    expect(slugWithSuffix('hello', 2)).toBe('hello-2')
  })

  it('rejects invalid slugs', () => {
    expect(isValidSlug('')).toBe(false)
    expect(isValidSlug('a/b')).toBe(false)
  })
})

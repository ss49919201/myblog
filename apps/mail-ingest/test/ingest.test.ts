import { describe, expect, it } from 'vitest'
import {
  envelopeMatchesHeaderFrom,
} from '../src/domain/auth'
import { collectAuthenticationResultLines, headerFromAddress } from '../src/ingest'

describe('ingest helpers', () => {
  it('collects authentication headers in order', () => {
    const store = new Map<string, string[]>([
      ['authentication-results', ['first']],
      ['arc-authentication-results', ['second']],
    ])
    const headers = {
      getAll: (name: string) => store.get(name.toLowerCase()) ?? [],
    } as Headers
    expect(collectAuthenticationResultLines(headers)).toEqual(['first', 'second'])
  })

  it('prefers header From over envelope for display identity', () => {
    const headers = new Headers({ From: 'Author <author@example.com>' })
    expect(headerFromAddress(headers, 'bounce@lists.example.com')).toBe(
      'Author <author@example.com>',
    )
  })

  it('requires envelope and header From to match', () => {
    expect(
      envelopeMatchesHeaderFrom(
        'author@example.com',
        'Author <author@example.com>',
      ),
    ).toBe(true)
    expect(
      envelopeMatchesHeaderFrom(
        'attacker@evil.com',
        'Author <author@example.com>',
      ),
    ).toBe(false)
  })
})

import { describe, expect, it } from 'vitest'
import {
  extractMailboxAddress,
  isMailAuthenticationValid,
  isSenderAllowed,
  parseAllowlist,
  parseAuthenticationResults,
} from '../src/domain/auth'

describe('allowlist', () => {
  it('parses comma-separated senders', () => {
    expect(parseAllowlist('a@x.com, b@y.com')).toEqual(['a@x.com', 'b@y.com'])
  })

  it('matches mailbox inside display name', () => {
    const list = ['author@example.com']
    expect(isSenderAllowed('Author <author@example.com>', list)).toBe(true)
    expect(isSenderAllowed('other@example.com', list)).toBe(false)
  })

  it('normalizes case', () => {
    expect(
      isSenderAllowed('Me <Author@Example.COM>', ['author@example.com']),
    ).toBe(true)
  })
})

describe('authentication-results', () => {
  it('passes when dkim and spf pass', () => {
    const v = parseAuthenticationResults([
      'mx.example.com; dkim=pass header.i=@example.com; spf=pass smtp.mailfrom=example.com',
    ])
    expect(isMailAuthenticationValid(v)).toBe(true)
  })

  it('passes when dkim and dmarc pass without spf', () => {
    const v = parseAuthenticationResults([
      'mx.example.com; dkim=pass; dmarc=pass policy.p=reject',
    ])
    expect(isMailAuthenticationValid(v)).toBe(true)
  })

  it('fails when dkim fails', () => {
    const v = parseAuthenticationResults(['mx.example.com; dkim=fail; spf=pass'])
    expect(isMailAuthenticationValid(v)).toBe(false)
  })

  it('extracts bare address', () => {
    expect(extractMailboxAddress('x@y.z')).toBe('x@y.z')
  })
})

import { describe, expect, it } from 'vitest'
import {
  CLOUDFLARE_EMAIL_AUTHSERV_ID,
  extractMailboxAddress,
  isMailAuthenticationValid,
  isSenderAllowed,
  parseAllowlist,
  selectTrustedAuthenticationLine,
  validateMailAuthentication,
  verifyAlignedAuthentication,
} from '../src/domain/auth'

const ALLOWED = 'author@example.com'

function cloudflareAuth(extra: string): string {
  return `i=1; ${CLOUDFLARE_EMAIL_AUTHSERV_ID}; ${extra}`
}

describe('allowlist', () => {
  it('parses comma-separated senders', () => {
    expect(parseAllowlist('a@x.com, b@y.com')).toEqual(['a@x.com', 'b@y.com'])
  })

  it('matches header From mailbox', () => {
    expect(isSenderAllowed('Author <author@example.com>', [ALLOWED])).toBe(true)
    expect(isSenderAllowed('other@example.com', [ALLOWED])).toBe(false)
  })
})

describe('trusted Authentication-Results', () => {
  it('ignores forged authserv-id and uses Cloudflare line', () => {
    const lines = [
      'evil.example; dmarc=pass header.from=example.com; dkim=pass; spf=pass',
      cloudflareAuth(
        'dkim=pass header.d=example.com header.i=@example.com; dmarc=pass header.from=example.com; spf=pass smtp.mailfrom=author@example.com',
      ),
    ]
    expect(selectTrustedAuthenticationLine(lines)).toContain(CLOUDFLARE_EMAIL_AUTHSERV_ID)
    const verdict = validateMailAuthentication(lines, 'author@example.com')
    expect(isMailAuthenticationValid(verdict)).toBe(true)
  })

  it('rejects when only forged Authentication-Results exist', () => {
    const lines = [
      'attacker.net; dmarc=pass header.from=example.com; dkim=pass header.d=example.com; spf=pass',
    ]
    const verdict = validateMailAuthentication(lines, ALLOWED)
    expect(isMailAuthenticationValid(verdict)).toBe(false)
    expect(verdict.detail).toContain(CLOUDFLARE_EMAIL_AUTHSERV_ID)
  })

  it('uses the last Cloudflare line when several are present', () => {
    const good = cloudflareAuth(
      'dmarc=pass header.from=example.com; dkim=pass header.d=example.com',
    )
    const bad = cloudflareAuth(
      'dmarc=fail; dkim=pass header.d=attacker.com; spf=pass',
    )
    const verdict = validateMailAuthentication([good, bad], ALLOWED)
    expect(isMailAuthenticationValid(verdict)).toBe(false)
  })
})

describe('From alignment', () => {
  it('rejects attacker DKIM+SPF with forged header From on allowlist', () => {
    const line = cloudflareAuth(
      'dkim=pass header.d=attacker.com header.i=@attacker.com; spf=pass smtp.mailfrom=bot@attacker.com; dmarc=fail',
    )
    const verdict = verifyAlignedAuthentication(line, ALLOWED)
    expect(verdict.dkimPass).toBe(true)
    expect(verdict.spfPass).toBe(true)
    expect(verdict.aligned).toBe(false)
    expect(isMailAuthenticationValid({ ...verdict, trusted: true })).toBe(false)
  })

  it('accepts legitimate mail with aligned DMARC', () => {
    const line = cloudflareAuth(
      'dmarc=pass header.from=example.com policy.dmarc=reject; dkim=pass header.d=example.com; spf=pass smtp.mailfrom=author@example.com',
    )
    const verdict = validateMailAuthentication([line], 'Author <author@example.com>')
    expect(isMailAuthenticationValid(verdict)).toBe(true)
  })

  it('accepts aligned DKIM when DMARC is absent', () => {
    const line = cloudflareAuth(
      'dkim=pass header.d=example.com header.i=@example.com; spf=pass',
    )
    const verdict = verifyAlignedAuthentication(line, ALLOWED)
    expect(verdict.aligned).toBe(true)
  })

  it('extracts bare address', () => {
    expect(extractMailboxAddress('x@y.z')).toBe('x@y.z')
  })
})

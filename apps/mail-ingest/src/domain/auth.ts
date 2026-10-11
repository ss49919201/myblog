export type MailAuthVerdict = {
  dkimPass: boolean
  spfPass: boolean
  dmarcPass: boolean
}

export function parseAllowlist(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

export function extractMailboxAddress(from: string): string {
  const angle = from.match(/<([^>]+)>/)
  if (angle) {
    return angle[1].trim().toLowerCase()
  }
  return from.trim().toLowerCase()
}

export function isSenderAllowed(from: string, allowlist: readonly string[]): boolean {
  const mailbox = extractMailboxAddress(from)
  return allowlist.some((entry) => extractMailboxAddress(entry) === mailbox)
}

/** Parse Authentication-Results (and ARC-Authentication-Results) for pass flags. */
export function parseAuthenticationResults(
  headerLines: readonly string[],
): MailAuthVerdict {
  const combined = headerLines.join(' ')
  return {
    dkimPass: /\bdkim=pass\b/i.test(combined),
    spfPass: /\bspf=pass\b/i.test(combined),
    dmarcPass: /\bdmarc=pass\b/i.test(combined),
  }
}

export function isMailAuthenticationValid(verdict: MailAuthVerdict): boolean {
  return verdict.dkimPass && (verdict.spfPass || verdict.dmarcPass)
}

export function formatAuthFailure(verdict: MailAuthVerdict): string {
  const parts = [
    `dkim=${verdict.dkimPass ? 'pass' : 'fail'}`,
    `spf=${verdict.spfPass ? 'pass' : 'fail'}`,
    `dmarc=${verdict.dmarcPass ? 'pass' : 'fail'}`,
  ]
  return parts.join(', ')
}

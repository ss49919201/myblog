/**
 * Cloudflare Email Routing stamps ARC-Authentication-Results with authserv-id
 * `mx.cloudflare.net` after SPF/DKIM/DMARC checks (Cloudflare blog, Email Routing).
 * @see https://blog.cloudflare.com/email-routing-subdomains/
 */
export const CLOUDFLARE_EMAIL_AUTHSERV_ID = 'mx.cloudflare.net'

export type MailAuthVerdict = {
  trusted: boolean
  dmarcPass: boolean
  dkimPass: boolean
  spfPass: boolean
  aligned: boolean
  detail: string
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

export function domainFromMailbox(mailbox: string): string {
  const at = mailbox.lastIndexOf('@')
  if (at === -1) {
    return ''
  }
  return mailbox.slice(at + 1).toLowerCase()
}

export function isSenderAllowed(from: string, allowlist: readonly string[]): boolean {
  const mailbox = extractMailboxAddress(from)
  return allowlist.some((entry) => extractMailboxAddress(entry) === mailbox)
}

export function envelopeMatchesHeaderFrom(
  envelopeFrom: string,
  headerFrom: string,
): boolean {
  return (
    extractMailboxAddress(envelopeFrom) === extractMailboxAddress(headerFrom)
  )
}

/** First semicolon-delimited token after optional ARC `i=N;` is the authserv-id (RFC 8601). */
export function extractAuthservId(line: string): string | null {
  let rest = line.trim()
  const arcInstance = /^i=\d+;\s*/i.exec(rest)
  if (arcInstance) {
    rest = rest.slice(arcInstance[0].length)
  }
  const semi = rest.indexOf(';')
  const id = (semi === -1 ? rest : rest.slice(0, semi)).trim()
  return id.length > 0 ? id : null
}

export function isTrustedCloudflareAuthserv(authservId: string): boolean {
  return authservId.toLowerCase() === CLOUDFLARE_EMAIL_AUTHSERV_ID
}

/**
 * Collects Authentication-Results and ARC-Authentication-Results in header order,
 * then returns the last line whose authserv-id is Cloudflare's MX.
 * Prepended forgeries use another authserv-id and are skipped.
 */
export function selectTrustedAuthenticationLine(
  headerLines: readonly string[],
): string | null {
  let lastTrusted: string | null = null
  for (const line of headerLines) {
    const authservId = extractAuthservId(line)
    if (authservId && isTrustedCloudflareAuthserv(authservId)) {
      lastTrusted = line
    }
  }
  return lastTrusted
}

function domainsAlign(authDomain: string, headerFromDomain: string): boolean {
  const a = authDomain.toLowerCase().replace(/^@/, '')
  const b = headerFromDomain.toLowerCase()
  return a.length > 0 && a === b
}

/**
 * Requires DMARC pass with header.from aligned to the header From domain, or
 * DKIM pass with header.d (or header.i) aligned. SPF alone cannot satisfy auth.
 */
export function verifyAlignedAuthentication(
  trustedLine: string,
  headerFrom: string,
): MailAuthVerdict {
  const fromDomain = domainFromMailbox(extractMailboxAddress(headerFrom))
  const dmarcPass = /\bdmarc=pass\b/i.test(trustedLine)
  const dkimPass = /\bdkim=pass\b/i.test(trustedLine)
  const spfPass = /\bspf=pass\b/i.test(trustedLine)

  let aligned = false
  let detail = 'no aligned dmarc or dkim pass'

  if (dmarcPass) {
    const dmarcFrom = trustedLine.match(/header\.from=([^\s;]+)/i)?.[1]
    if (dmarcFrom && domainsAlign(dmarcFrom, fromDomain)) {
      aligned = true
      detail = 'dmarc pass aligned with header From'
    }
  }

  if (!aligned && dkimPass) {
    const dkimDomain =
      trustedLine.match(/header\.d=([^\s;]+)/i)?.[1] ??
      trustedLine.match(/header\.i=@?([^\s;(@]+)/i)?.[1]
    if (dkimDomain && domainsAlign(dkimDomain, fromDomain)) {
      aligned = true
      detail = 'dkim pass aligned with header From'
    }
  }

  return {
    trusted: true,
    dmarcPass,
    dkimPass,
    spfPass,
    aligned,
    detail,
  }
}

export function validateMailAuthentication(
  allAuthHeaderLines: readonly string[],
  headerFrom: string,
): MailAuthVerdict {
  const trustedLine = selectTrustedAuthenticationLine(allAuthHeaderLines)
  if (!trustedLine) {
    return {
      trusted: false,
      dmarcPass: false,
      dkimPass: false,
      spfPass: false,
      aligned: false,
      detail: `no Authentication-Results from ${CLOUDFLARE_EMAIL_AUTHSERV_ID}`,
    }
  }
  return verifyAlignedAuthentication(trustedLine, headerFrom)
}

export function isMailAuthenticationValid(verdict: MailAuthVerdict): boolean {
  return verdict.trusted && verdict.aligned
}

export function formatAuthFailure(verdict: MailAuthVerdict): string {
  if (!verdict.trusted) {
    return verdict.detail
  }
  return `${verdict.detail} (dmarc=${verdict.dmarcPass ? 'pass' : 'fail'}, dkim=${verdict.dkimPass ? 'pass' : 'fail'}, spf=${verdict.spfPass ? 'pass' : 'fail'}, aligned=${verdict.aligned})`
}

const CSRF_COOKIE = 'myblog_admin_csrf'
const TOKEN_BYTES = 32

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function generateCsrfToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES)
  crypto.getRandomValues(bytes)
  return bytesToHex(bytes)
}

export function csrfCookieOptions(): string {
  return 'Path=/; HttpOnly; Secure; SameSite=Strict'
}

export function readCsrfCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) {
    return null
  }
  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=')
    if (name === CSRF_COOKIE) {
      return rest.join('=')
    }
  }
  return null
}

export function csrfSetCookieHeader(token: string): string {
  return `${CSRF_COOKIE}=${token}; ${csrfCookieOptions()}`
}

export function csrfClearCookieHeader(): string {
  return `${CSRF_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
}

export function verifyCsrf(
  cookieHeader: string | undefined,
  formToken: string | undefined,
): boolean {
  if (!formToken || formToken.length < 16) {
    return false
  }
  const cookie = readCsrfCookie(cookieHeader)
  if (!cookie) {
    return false
  }
  return cookie === formToken
}

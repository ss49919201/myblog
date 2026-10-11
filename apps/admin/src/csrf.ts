const CSRF_COOKIE = 'admin_csrf'
const TOKEN_BYTES = 32

export function newCsrfToken(): string {
  const bytes = new Uint8Array(TOKEN_BYTES)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes)
}

export function csrfCookieName(): string {
  return CSRF_COOKIE
}

export function readCsrfCookie(cookieHeader: string | null): string | null {
  if (cookieHeader === null) {
    return null
  }
  const parts = cookieHeader.split(';')
  for (const part of parts) {
    const [name, ...rest] = part.trim().split('=')
    if (name === CSRF_COOKIE) {
      const value = rest.join('=')
      return value.length > 0 ? decodeURIComponent(value) : null
    }
  }
  return null
}

export function csrfMatches(
  cookieToken: string | null,
  formToken: string | null,
): boolean {
  if (cookieToken === null || formToken === null) {
    return false
  }
  if (cookieToken.length === 0 || formToken.length === 0) {
    return false
  }
  return cookieToken === formToken
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

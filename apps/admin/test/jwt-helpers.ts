import { importPKCS8, SignJWT } from 'jose'
import { TEST_PRIVATE_KEY_PEM } from './test-private-key'

export const TEST_TEAM_DOMAIN = 'test.cloudflareaccess.com'
export const TEST_AUDIENCE = 'test-access-audience'

let privateKeyPromise: ReturnType<typeof importPKCS8> | null = null

function loadPrivateKey() {
  if (privateKeyPromise === null) {
    privateKeyPromise = importPKCS8(TEST_PRIVATE_KEY_PEM, 'RS256')
  }
  return privateKeyPromise
}

export async function signAccessJwt(
  options: { expired?: boolean; audience?: string } = {},
): Promise<string> {
  const key = await loadPrivateKey()
  const builder = new SignJWT({ email: 'author@example.com' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer(`https://${TEST_TEAM_DOMAIN}`)
    .setAudience(options.audience ?? TEST_AUDIENCE)

  if (options.expired) {
    builder.setExpirationTime(Math.floor(Date.now() / 1000) - 60)
  } else {
    builder.setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
  }

  return builder.sign(key)
}

import { importJWK, SignJWT } from 'jose'
import fixture from './fixtures/access-jwks.json'

const TEAM = 'test-team.cloudflareaccess.com'
const AUD = 'test-audience-tag'

let privateKey: CryptoKey | null = null

async function signingKey(): Promise<CryptoKey> {
  if (!privateKey) {
    const key = await importJWK(fixture.privateJwk, 'RS256')
    if (!(key instanceof CryptoKey)) {
      throw new Error('expected CryptoKey')
    }
    privateKey = key
  }
  return privateKey
}

export async function signAccessJwt(): Promise<string> {
  const key = await signingKey()
  return new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: 'dev-test-kid' })
    .setIssuer(`https://${TEAM}`)
    .setAudience(AUD)
    .setExpirationTime('2h')
    .sign(key)
}

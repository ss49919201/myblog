import { createLocalJWKSet, createRemoteJWKSet, jwtVerify } from 'jose'
import {
  LOCAL_ACCESS_TEST_TEAM,
  localAccessTestPublicJwk,
} from './local-access-jwks'

export type AccessAuthEnv = {
  CF_ACCESS_TEAM_DOMAIN: string
  CF_ACCESS_AUD: string
}

let jwksByTeam: Map<string, ReturnType<typeof createRemoteJWKSet>> =
  new Map()

let localTestJwks: ReturnType<typeof createLocalJWKSet> | null = null

function getJwks(teamDomain: string) {
  if (teamDomain === LOCAL_ACCESS_TEST_TEAM) {
    if (!localTestJwks) {
      localTestJwks = createLocalJWKSet({
        keys: [localAccessTestPublicJwk],
      })
    }
    return localTestJwks
  }
  let jwks = jwksByTeam.get(teamDomain)
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`https://${teamDomain}/cdn-cgi/access/certs`),
    )
    jwksByTeam.set(teamDomain, jwks)
  }
  return jwks
}

export async function verifyAccessJwt(
  env: AccessAuthEnv,
  assertion: string | undefined,
): Promise<boolean> {
  if (!assertion) {
    return false
  }
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN.trim()
  const aud = env.CF_ACCESS_AUD.trim()
  if (teamDomain === '' || aud === '') {
    return false
  }
  try {
    await jwtVerify(assertion, getJwks(teamDomain), {
      issuer: `https://${teamDomain}`,
      audience: aud,
    })
    return true
  } catch {
    return false
  }
}

export function resetAccessJwksCacheForTests(): void {
  jwksByTeam = new Map()
  localTestJwks = null
}

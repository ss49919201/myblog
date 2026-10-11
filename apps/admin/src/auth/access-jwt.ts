import * as jose from 'jose'
import { err, ok, type Result } from 'neverthrow'
import type { Env } from '../env'

export type AccessAuthError = { type: 'Forbidden'; reason: string }

function readAssertionHeader(request: Request): string | null {
  const value = request.headers.get('Cf-Access-Jwt-Assertion')
  if (value === null || value.trim().length === 0) {
    return null
  }
  return value.trim()
}

async function resolveJwks(env: Env): Promise<jose.JSONWebKeySet> {
  if (env.ACCESS_JWKS_JSON && env.ACCESS_JWKS_JSON.length > 0) {
    return JSON.parse(env.ACCESS_JWKS_JSON) as jose.JSONWebKeySet
  }
  const url = new URL(
    `https://${env.CF_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`,
  )
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`JWKS fetch failed: ${response.status}`)
  }
  return (await response.json()) as jose.JSONWebKeySet
}

export async function verifyAccessRequest(
  request: Request,
  env: Env,
): Promise<Result<void, AccessAuthError>> {
  const assertion = readAssertionHeader(request)
  if (assertion === null) {
    return err({ type: 'Forbidden', reason: 'missing_jwt' })
  }

  try {
    const jwks = await resolveJwks(env)
    const keySet = jose.createLocalJWKSet(jwks)
    await jose.jwtVerify(assertion, keySet, {
      audience: env.CF_ACCESS_AUD,
    })
    return ok(undefined)
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : 'jwt verification failed'
    return err({ type: 'Forbidden', reason: message })
  }
}

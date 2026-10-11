declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    CF_ACCESS_TEAM_DOMAIN: string
    CF_ACCESS_AUD: string
    PUBLIC_WEB_ORIGIN: string
    /** Optional local JWKS JSON for vitest; empty in production. */
    ACCESS_JWKS_JSON?: string
  }
}

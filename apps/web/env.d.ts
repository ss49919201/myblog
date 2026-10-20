interface CacheStorage {
  readonly default: Cache
}

declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    SITE_ORIGIN?: string
  }
}

declare module '*.woff?url' {
  const value: string
  export default value
}

declare module '@cloudflare/kumo/styles/standalone?inline' {
  const css: string
  export default css
}

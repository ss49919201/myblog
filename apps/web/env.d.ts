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

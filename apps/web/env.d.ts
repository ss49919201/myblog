declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    SITE_ORIGIN?: string
  }
}

declare module '*.woff' {
  const value: ArrayBuffer
  export default value
}

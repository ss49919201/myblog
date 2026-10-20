declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    PUBLIC_WEB_URL: string
  }
}

declare module '@cloudflare/kumo/styles/standalone?inline' {
  const css: string
  export default css
}

import type { D1Migration } from 'cloudflare:test'

declare module 'vitest' {
  interface ProvidedContext {
    testMigrations: D1Migration[]
  }
}

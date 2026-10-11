import type { D1Migration } from 'cloudflare:test'

declare module 'vitest' {
  export interface ProvidedContext {
    testMigrations: D1Migration[]
  }
}

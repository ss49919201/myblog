import { createWebDatabase } from './composition-root'
import type { ReadOnlyKysely } from './db/read-only-kysely'
import type { Database } from './db/schema'

export type Env = {
  DB: ReadOnlyKysely<Database>
  SITE_ORIGIN?: string
}

export function toAppEnv(worker: Cloudflare.Env): Env {
  return {
    DB: createWebDatabase(worker.DB),
    SITE_ORIGIN: worker.SITE_ORIGIN,
  }
}

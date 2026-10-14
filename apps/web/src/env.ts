import { createReadOnlyD1, type ReadOnlyD1 } from './db/read-only-d1'

export type Env = {
  DB: ReadOnlyD1
  SITE_ORIGIN?: string
}

export function toAppEnv(worker: Cloudflare.Env): Env {
  return {
    DB: createReadOnlyD1(worker.DB),
    SITE_ORIGIN: worker.SITE_ORIGIN,
  }
}

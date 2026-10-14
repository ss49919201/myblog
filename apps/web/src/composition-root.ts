import { Kysely } from 'kysely'
import { D1Dialect } from 'kysely-d1'
import type { ReadOnlyKysely } from './db/read-only-kysely'
import type { Database } from './db/schema'

export function createWebDatabase(d1: D1Database): ReadOnlyKysely<Database> {
  const kysely = new Kysely<Database>({
    dialect: new D1Dialect({ database: d1 }),
  })
  return {
    selectFrom: kysely.selectFrom.bind(kysely),
    with: kysely.with.bind(kysely),
  }
}

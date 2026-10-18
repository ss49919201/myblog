import type { Kysely } from 'kysely'

export type ReadOnly<DB> = Pick<Kysely<DB>, 'selectFrom'>

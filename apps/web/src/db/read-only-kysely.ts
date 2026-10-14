import type { Kysely } from 'kysely'

export type ReadOnlyKysely<DB> = Pick<Kysely<DB>, 'selectFrom'>

import type { ReadOnlyKysely } from '../../src/db/read-only-kysely'
import type { Database } from '../../src/db/schema'

declare const db: ReadOnlyKysely<Database>

// @ts-expect-error ReadOnlyKysely exposes only selectFrom and with
db.insertInto('posts')

// @ts-expect-error
db.updateTable('posts')

// @ts-expect-error
db.deleteFrom('posts')

// @ts-expect-error
db.replaceInto('posts')

// @ts-expect-error
db.mergeInto('posts')

// @ts-expect-error
db.schema

// @ts-expect-error
db.executeQuery

export {}

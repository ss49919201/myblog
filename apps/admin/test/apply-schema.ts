import { applyD1Migrations, env } from 'cloudflare:test'
import { beforeAll, beforeEach, inject } from 'vitest'

beforeAll(async () => {
  await applyD1Migrations(env.DB, inject('testMigrations'))
})

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM posts').run()
})

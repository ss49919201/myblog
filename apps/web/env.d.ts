interface D1TestMigration {
  name: string
  queries: string[]
}

declare namespace Cloudflare {
  interface Env {
    DB: D1Database
    TEST_MIGRATIONS: D1TestMigration[]
  }
}

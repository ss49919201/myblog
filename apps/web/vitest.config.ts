import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cloudflareTest } from '@cloudflare/vitest-plugin'
import { defineConfig } from 'vitest/config'
import { unstable_splitSqlQuery } from 'wrangler'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const schemaSql = readFileSync(path.join(rootDir, 'schema.sql'), 'utf8')

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        bindings: {
          TEST_MIGRATIONS: [
            {
              name: '0000_schema.sql',
              queries: unstable_splitSqlQuery(schemaSql),
            },
          ],
        },
      },
    }),
  ],
  test: {
    setupFiles: ['./test/apply-schema.ts'],
  },
})

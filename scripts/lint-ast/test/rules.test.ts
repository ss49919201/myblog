import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkAdminDomainImports } from '../rules/admin-domain-imports.js'
import { checkWebCompositionBoundary } from '../rules/web-composition-boundary.js'

const root = join(import.meta.dirname, '../../..')
const fixtures = join(import.meta.dirname, 'fixtures')

function fixture(name: string): string {
  return readFileSync(join(fixtures, name), 'utf8')
}

describe('web-composition-boundary', () => {
  it('allows composition-root.ts to use Kysely and D1', () => {
    const file = join(root, 'apps/web/src/composition-root.ts')
    const violations = checkWebCompositionBoundary(
      root,
      file,
      readFileSync(file, 'utf8'),
    )
    expect(violations).toEqual([])
  })

  it('flags D1Database in web feature code', () => {
    const violations = checkWebCompositionBoundary(
      root,
      join(root, 'apps/web/src/posts/repository.ts'),
      fixture('web-uses-d1.ts'),
    )
    expect(violations.some((v) => v.ruleId === 'web-composition-boundary')).toBe(
      true,
    )
  })

  it('flags value import from kysely outside composition root', () => {
    const violations = checkWebCompositionBoundary(
      root,
      join(root, 'apps/web/src/posts/repository.ts'),
      fixture('web-imports-kysely.ts'),
    )
    expect(violations.length).toBeGreaterThan(0)
  })

  it('allows import type from kysely', () => {
    const violations = checkWebCompositionBoundary(
      root,
      join(root, 'apps/web/src/db/read-only-kysely.ts'),
      fixture('web-import-type-kysely.ts'),
    )
    expect(violations).toEqual([])
  })
})

describe('admin-domain-imports', () => {
  it('allows domain-only imports', () => {
    const violations = checkAdminDomainImports(
      root,
      join(root, 'apps/admin/src/domain/slug.ts'),
      fixture('admin-domain-ok.ts'),
    )
    expect(violations).toEqual([])
  })

  it('flags hono import in domain', () => {
    const violations = checkAdminDomainImports(
      root,
      join(root, 'apps/admin/src/domain/bad.ts'),
      fixture('admin-domain-hono.ts'),
    )
    expect(violations.length).toBeGreaterThan(0)
  })
})

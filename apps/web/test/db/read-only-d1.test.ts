import { describe, expect, it, vi } from 'vitest'
import {
  createReadOnlyD1,
  validateReadOnlySql,
} from '../../src/db/read-only-d1'

function fakeD1Database(): D1Database {
  const prepare = vi.fn((_sql: string) => {
    const stmt = {
      bind: vi.fn(() => stmt),
      first: vi.fn(async () => null),
      all: vi.fn(async () => ({
        results: [],
        success: true as const,
        meta: {} as D1Response['meta'],
      })),
      run: vi.fn(async () => ({
        success: true as const,
        meta: {} as D1Response['meta'],
      })),
      raw: vi.fn(),
    }
    return stmt as unknown as D1PreparedStatement
  })
  return { prepare } as unknown as D1Database
}

describe('validateReadOnlySql', () => {
  it('accepts SELECT', () => {
    expect(validateReadOnlySql('SELECT 1').isOk()).toBe(true)
  })

  it('accepts WITH … SELECT', () => {
    expect(
      validateReadOnlySql(
        'WITH recent AS (SELECT slug FROM posts) SELECT * FROM recent',
      ).isOk(),
    ).toBe(true)
  })

  it('rejects INSERT', () => {
    const result = validateReadOnlySql('INSERT INTO posts VALUES (1)')
    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error.type).toBe('WriteSqlRejected')
    }
  })

  it('rejects UPDATE', () => {
    expect(validateReadOnlySql('UPDATE posts SET title = ?').isErr()).toBe(true)
  })

  it('ignores write keywords inside string literals', () => {
    expect(
      validateReadOnlySql(
        "SELECT slug FROM posts WHERE title = 'INSERT tutorial'",
      ).isOk(),
    ).toBe(true)
  })
})

describe('createReadOnlyD1', () => {
  it('does not call the underlying prepare for write SQL', () => {
    const db = fakeD1Database()
    const readOnly = createReadOnlyD1(db)
    const result = readOnly.prepare('DELETE FROM posts')
    expect(result.isErr()).toBe(true)
    expect(db.prepare).not.toHaveBeenCalled()
  })

  it('delegates SELECT to the underlying database', async () => {
    const db = fakeD1Database()
    const readOnly = createReadOnlyD1(db)
    const prepared = readOnly.prepare('SELECT slug FROM posts WHERE slug = ?')
    expect(prepared.isOk()).toBe(true)
    if (prepared.isOk()) {
      await prepared.value.bind('hello').first()
    }
    expect(db.prepare).toHaveBeenCalledWith(
      'SELECT slug FROM posts WHERE slug = ?',
    )
  })
})

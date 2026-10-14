import { err, ok, type Result } from 'neverthrow'

export type ReadOnlyD1Error = {
  type: 'WriteSqlRejected'
  sql: string
}

export type ReadOnlyD1PreparedStatement = {
  bind: D1PreparedStatement['bind'] extends (...args: infer A) => unknown
    ? (...args: A) => ReadOnlyD1PreparedStatement
    : never
  first: D1PreparedStatement['first']
  all: D1PreparedStatement['all']
  run: D1PreparedStatement['run']
}

export type ReadOnlyD1 = {
  prepare(query: string): Result<ReadOnlyD1PreparedStatement, ReadOnlyD1Error>
}

const WRITE_KEYWORD =
  /\b(INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER)\b/i

export function createReadOnlyD1(db: D1Database): ReadOnlyD1 {
  return {
    prepare(query: string) {
      return validateReadOnlySql(query).map((sql) =>
        wrapStatement(db.prepare(sql)),
      )
    },
  }
}

function wrapStatement(stmt: D1PreparedStatement): ReadOnlyD1PreparedStatement {
  return {
    bind(...values) {
      return wrapStatement(stmt.bind(...values))
    },
    first() {
      return stmt.first()
    },
    all() {
      return stmt.all()
    },
    run() {
      return stmt.run()
    },
  }
}

export function validateReadOnlySql(
  sql: string,
): Result<string, ReadOnlyD1Error> {
  const trimmed = stripSqlComments(sql).trim()
  if (trimmed.length === 0) {
    return err({ type: 'WriteSqlRejected', sql })
  }

  const withoutLiterals = stripStringLiterals(trimmed)
  if (WRITE_KEYWORD.test(withoutLiterals)) {
    return err({ type: 'WriteSqlRejected', sql })
  }

  const firstWord =
    withoutLiterals.match(/^[\s(]*(\w+)/)?.[1]?.toUpperCase() ?? ''
  if (firstWord !== 'SELECT' && firstWord !== 'WITH' && firstWord !== 'EXPLAIN') {
    return err({ type: 'WriteSqlRejected', sql })
  }

  return ok(trimmed)
}

function stripSqlComments(sql: string): string {
  let out = ''
  let i = 0
  while (i < sql.length) {
    if (sql.startsWith('--', i)) {
      i += 2
      while (i < sql.length && sql[i] !== '\n') {
        i += 1
      }
      continue
    }
    if (sql.startsWith('/*', i)) {
      i += 2
      while (i < sql.length && !sql.startsWith('*/', i)) {
        i += 1
      }
      i += 2
      continue
    }
    out += sql[i]
    i += 1
  }
  return out
}

function stripStringLiterals(sql: string): string {
  let out = ''
  let i = 0
  while (i < sql.length) {
    const ch = sql[i]
    if (ch === "'") {
      out += "''"
      i += 1
      while (i < sql.length) {
        if (sql[i] === "'" && sql[i + 1] === "'") {
          i += 2
          continue
        }
        if (sql[i] === "'") {
          i += 1
          break
        }
        i += 1
      }
      continue
    }
    if (ch === '"') {
      out += '""'
      i += 1
      while (i < sql.length && sql[i] !== '"') {
        i += 1
      }
      if (i < sql.length) {
        i += 1
      }
      continue
    }
    out += ch
    i += 1
  }
  return out
}

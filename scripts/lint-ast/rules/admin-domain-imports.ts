import { Lang, parse } from '@ast-grep/napi'
import { relative } from 'node:path'
import type { Violation } from '../violation.js'

const ADMIN_DOMAIN = 'apps/admin/src/domain/'

function repoPath(root: string, absolutePath: string): string {
  return relative(root, absolutePath).replaceAll('\\', '/')
}

export function checkAdminDomainImports(
  root: string,
  absolutePath: string,
  source: string,
): Violation[] {
  const file = repoPath(root, absolutePath)
  if (!file.startsWith(ADMIN_DOMAIN) || !file.endsWith('.ts')) {
    return []
  }

  const ast = parse(Lang.TypeScript, source)
  const violations: Violation[] = []

  for (const node of ast.root().findAll({
    rule: { kind: 'import_statement' },
  })) {
    const text = node.text()
    const forbidden =
      /from\s+['"]hono['"]/.test(text) ||
      /from\s+['"]markdown-it['"]/.test(text) ||
      /from\s+['"]jose['"]/.test(text)
    if (!forbidden) {
      continue
    }
    const range = node.range().start
    violations.push({
      ruleId: 'admin-domain-imports',
      file,
      line: range.line + 1,
      column: range.column + 1,
      message:
        'apps/admin/src/domain must not import hono, markdown-it, or jose',
    })
  }

  for (const node of ast.root().findAll({
    rule: { kind: 'type_identifier', regex: '^D1Database$' },
  })) {
    const range = node.range().start
    violations.push({
      ruleId: 'admin-domain-imports',
      file,
      line: range.line + 1,
      column: range.column + 1,
      message: 'apps/admin/src/domain must not reference D1Database',
    })
  }

  return violations
}

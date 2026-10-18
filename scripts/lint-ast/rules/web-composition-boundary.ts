import { Lang, parse } from '@ast-grep/napi'
import { relative } from 'node:path'
import type { Violation } from '../violation.js'

const WEB_SRC = 'apps/web/src/'
const COMPOSITION_ROOT = 'apps/web/src/composition-root.ts'

function repoPath(root: string, absolutePath: string): string {
  return relative(root, absolutePath).replaceAll('\\', '/')
}

function isWebSource(repoRelativePath: string): boolean {
  return (
    repoRelativePath.startsWith(WEB_SRC) &&
    (repoRelativePath.endsWith('.ts') || repoRelativePath.endsWith('.tsx')) &&
    repoRelativePath !== COMPOSITION_ROOT
  )
}

export function checkWebCompositionBoundary(
  root: string,
  absolutePath: string,
  source: string,
): Violation[] {
  const file = repoPath(root, absolutePath)
  if (!isWebSource(file)) {
    return []
  }

  const ast = parse(Lang.TypeScript, source)
  const tree = ast.root()
  const violations: Violation[] = []

  for (const node of tree.findAll({
    rule: { kind: 'type_identifier', regex: '^D1Database$' },
  })) {
    const range = node.range().start
    violations.push({
      ruleId: 'web-composition-boundary',
      file,
      line: range.line + 1,
      column: range.column + 1,
      message:
        'apps/web must not reference D1Database outside composition-root.ts',
    })
  }

  for (const node of tree.findAll('new Kysely')) {
    const range = node.range().start
    violations.push({
      ruleId: 'web-composition-boundary',
      file,
      line: range.line + 1,
      column: range.column + 1,
      message: 'apps/web must not construct Kysely outside composition-root.ts',
    })
  }

  for (const node of tree.findAll({
    rule: { kind: 'import_statement' },
  })) {
    const text = node.text()
    if (text.startsWith('import type ')) {
      continue
    }
    if (/from\s+['"]kysely['"]/.test(text)) {
      const range = node.range().start
      violations.push({
        ruleId: 'web-composition-boundary',
        file,
        line: range.line + 1,
        column: range.column + 1,
        message:
          'apps/web must not import runtime symbols from kysely outside composition-root.ts',
      })
    }
    if (/from\s+['"]kysely-d1['"]/.test(text)) {
      const range = node.range().start
      violations.push({
        ruleId: 'web-composition-boundary',
        file,
        line: range.line + 1,
        column: range.column + 1,
        message:
          'apps/web must not import kysely-d1 outside composition-root.ts',
      })
    }
  }

  return violations
}

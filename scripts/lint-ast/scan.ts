import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { checkAdminDomainImports } from './rules/admin-domain-imports.js'
import { checkWebCompositionBoundary } from './rules/web-composition-boundary.js'
import type { Violation } from './violation.js'

function walkTsFiles(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []
  for (const entry of entries) {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      if (entry === 'node_modules' || entry === '.git') {
        continue
      }
      files.push(...walkTsFiles(path))
      continue
    }
    if (path.endsWith('.ts') || path.endsWith('.tsx')) {
      files.push(path)
    }
  }
  return files
}

export function scanRepository(root: string): Violation[] {
  const violations: Violation[] = []
  for (const absolutePath of walkTsFiles(join(root, 'apps'))) {
    const source = readFileSync(absolutePath, 'utf8')
    violations.push(
      ...checkWebCompositionBoundary(root, absolutePath, source),
      ...checkAdminDomainImports(root, absolutePath, source),
    )
  }
  return violations
}

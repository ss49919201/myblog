import { scanRepository } from './scan.js'

const root = process.cwd()
const violations = scanRepository(root)

for (const violation of violations) {
  const location = `${violation.file}:${violation.line}:${violation.column}`
  process.stderr.write(
    `${location} [${violation.ruleId}] ${violation.message}\n`,
  )
}

if (violations.length > 0) {
  process.exit(1)
}

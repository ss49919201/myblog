#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const appRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const cfBin = join(appRoot, 'node_modules/.bin/cf')
const drizzleKit = join(appRoot, 'node_modules/.bin/drizzle-kit')
const migrationsDir = join(appRoot, 'migrations')
const seedPath = join(appRoot, 'seed.sql')

const usage = `usage: node scripts/db.mjs <command>

commands:
  generate [--name <migration>]
  local plan
  local apply
  local seed
  remote plan
  remote apply
  check

DATABASE_ID is required for local and remote commands.
BLOG_PERSIST_STATE selects the local D1 directory when set.`

main()

function main() {
  const argv = process.argv.slice(2)
  const key =
    argv[0] === 'generate' || argv[0] === 'check'
      ? argv[0]
      : argv.slice(0, 2).join(' ')
  const commands = {
    generate: () =>
      finish(spawnInherit(drizzleKit, ['generate', ...argv.slice(1)])),
    check: () => finish(spawnInherit(drizzleKit, ['check'])),
    'local plan': () => finish(migrations('list', true)),
    'local apply': () => finish(migrations('apply', true)),
    'local seed': () =>
      finish(d1Raw(readFileSync(seedPath, 'utf8'), true)),
    'remote plan': () => finish(migrations('list', false)),
    'remote apply': () => finish(migrations('apply', false)),
  }
  const runCommand = commands[key]
  if (!runCommand) {
    console.error(usage)
    process.exit(1)
  }
  runCommand()
}

function migrations(action, local) {
  const args = [
    'd1',
    'migrations',
    action,
    databaseId(),
    '--dir',
    migrationsDir,
  ]
  if (local) args.push(...localFlags())
  return spawnInherit(cfBin, args)
}

function d1Raw(sql, local) {
  const args = ['d1', 'raw', databaseId(), '--sql', sql]
  if (local) args.push(...localFlags())
  return spawnInherit(cfBin, args)
}

function localFlags() {
  const flags = ['--local']
  if (process.env.BLOG_PERSIST_STATE) {
    flags.push('--persist-to', process.env.BLOG_PERSIST_STATE)
  }
  return flags
}

function databaseId() {
  const id = process.env.DATABASE_ID
  if (!id) {
    console.error('DATABASE_ID is required')
    process.exit(1)
  }
  return id
}

function finish(status) {
  process.exit(status)
}

function spawnInherit(command, args) {
  const result = spawnSync(command, args, {
    cwd: appRoot,
    encoding: 'utf8',
    env: { ...process.env, CF_QUIET: '1' },
    stdio: 'inherit',
  })
  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }
  return result.status ?? 1
}

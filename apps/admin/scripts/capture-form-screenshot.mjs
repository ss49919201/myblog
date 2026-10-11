import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { importPKCS8, SignJWT } from 'jose'
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const TEST_PRIVATE_KEY_PEM = readFileSync(
  path.join(root, 'test/fixtures/test-private.pem'),
  'utf8',
)
const outDir = '/opt/cursor/artifacts/screenshots'
const htmlPath = '/tmp/admin-form.html'
const screenshotPath = path.join(outDir, 'admin-form-mobile.png')
const port = 8788

async function signJwt() {
  const key = await importPKCS8(TEST_PRIVATE_KEY_PEM, 'RS256')
  return new SignJWT({ email: 'author@example.com' })
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .setIssuer('https://test.cloudflareaccess.com')
    .setAudience('test-access-audience')
    .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
    .sign(key)
}

function waitForServer(ms = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const tick = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/`, {
          headers: { 'Cf-Access-Jwt-Assertion': await signJwt() },
        })
        if (res.ok) {
          resolve(undefined)
          return
        }
      } catch {
        // retry
      }
      if (Date.now() - start > ms) {
        reject(new Error('wrangler dev did not become ready'))
        return
      }
      setTimeout(tick, 400)
    }
    tick()
  })
}

const wrangler = spawn(
  'pnpm',
  ['exec', 'wrangler', 'dev', '--config', 'wrangler.vitest.jsonc', '--port', String(port)],
  { cwd: root, stdio: 'inherit' },
)

try {
  await waitForServer()
  const jwt = await signJwt()
  const res = await fetch(`http://127.0.0.1:${port}/`, {
    headers: { 'Cf-Access-Jwt-Assertion': jwt },
  })
  const html = await res.text()
  writeFileSync(htmlPath, html)

  await new Promise((resolve, reject) => {
    const chrome = spawn(
      process.env.CHROME_BIN ?? 'google-chrome',
      [
        '--headless=new',
        '--disable-gpu',
        `--window-size=390,844`,
        `--screenshot=${screenshotPath}`,
        `file://${htmlPath}`,
      ],
      { stdio: 'inherit' },
    )
    chrome.on('exit', (code) =>
      code === 0 ? resolve(undefined) : reject(new Error(`chromium exit ${code}`)),
    )
  })
  console.log(`saved ${screenshotPath}`)
} finally {
  wrangler.kill('SIGTERM')
}

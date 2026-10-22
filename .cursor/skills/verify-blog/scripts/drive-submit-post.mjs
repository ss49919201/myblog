#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { join } from 'node:path'

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--web-url') out.webUrl = argv[++i]
    else if (a === '--admin-url') out.adminUrl = argv[++i]
    else if (a === '--access-jwt') out.accessJwt = argv[++i]
    else if (a === '--artifacts') out.artifacts = argv[++i]
  }
  if (!out.webUrl || !out.adminUrl || !out.artifacts || !out.accessJwt) {
    throw new Error('missing required args')
  }
  return out
}

async function main() {
  const require = createRequire(import.meta.url)
  const { chromium } = require('playwright')
  const { webUrl, adminUrl, accessJwt, artifacts } = parseArgs(process.argv.slice(2))
  await mkdir(artifacts, { recursive: true })

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const title = `Verify agent ${stamp}`
  const bodyMd = 'Submitted through verify-blog submit-post drive.'

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    extraHTTPHeaders: {
      'CF-Access-Jwt-Assertion': accessJwt,
    },
  })

  await page.goto(adminUrl, { waitUntil: 'domcontentloaded' })
  await page.getByLabel('タイトル').fill(title)
  await page.getByLabel('本文（Markdown）').fill(bodyMd)
  await page.getByRole('button', { name: '公開する' }).click()
  await page.getByText('公開しました。').waitFor()

  await page.screenshot({ path: join(artifacts, 'admin-success.png'), fullPage: true })
  const adminHtml = await page.content()
  await writeFile(join(artifacts, 'admin-success.html'), adminHtml, 'utf8')

  await browser.close()

  const listRes = await fetch(`${webUrl}/`)
  const listHtml = await listRes.text()
  await writeFile(join(artifacts, 'web-home.html'), listHtml, 'utf8')

  const titleIdx = listHtml.indexOf(title)
  if (titleIdx < 0) {
    throw new Error('new post title not found on web home')
  }
  const slice = listHtml.slice(Math.max(0, titleIdx - 200), titleIdx + 50)
  const slugMatch = slice.match(/href="\/posts\/([^"]+)"/)
  if (!slugMatch) {
    throw new Error('slug link not found near new post title')
  }
  const slug = slugMatch[1]

  const postRes = await fetch(`${webUrl}/posts/${slug}`)
  const postHtml = await postRes.text()
  await writeFile(join(artifacts, 'web-post.html'), postHtml, 'utf8')

  const ogRes = await fetch(`${webUrl}/og/posts/${slug}.png`)
  const ogBytes = Buffer.from(await ogRes.arrayBuffer())
  await writeFile(join(artifacts, 'og-post.png'), ogBytes)

  const summary = {
    feature: 'submit-post',
    title,
    slug,
    webUrl: `${webUrl}/posts/${slug}`,
    ogUrl: `${webUrl}/og/posts/${slug}.png`,
    http: {
      webHome: listRes.status,
      webPost: postRes.status,
      ogPng: ogRes.status,
    },
    ogBytes: ogBytes.length,
    accessJwtUsed: true,
    note:
      'CF-Access-Jwt-Assertion is a local harness header only. Production Access sits in front of the admin worker; local cf dev has no Access gate.',
  }

  if (postRes.status !== 200 || ogRes.status !== 200 || ogBytes.length < 1000) {
    throw new Error(`verification failed: ${JSON.stringify(summary)}`)
  }

  await writeFile(join(artifacts, 'summary.json'), JSON.stringify(summary, null, 2), 'utf8')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

import { describe, expect, it } from 'vitest'
import { parseRawEmail } from '../src/domain/mail'

function buildMime(parts: {
  subject: string
  from: string
  text?: string
  html?: string
}): ArrayBuffer {
  const lines = [
    `From: ${parts.from}`,
    `To: ingest@example.com`,
    `Subject: ${parts.subject}`,
    'MIME-Version: 1.0',
  ]
  if (parts.text !== undefined && parts.html !== undefined) {
    lines.push('Content-Type: multipart/alternative; boundary="b"')
    lines.push('')
    lines.push('--b')
    lines.push('Content-Type: text/plain; charset=utf-8')
    lines.push('')
    lines.push(parts.text)
    lines.push('--b')
    lines.push('Content-Type: text/html; charset=utf-8')
    lines.push('')
    lines.push(parts.html)
    lines.push('--b--')
  } else if (parts.text !== undefined) {
    lines.push('Content-Type: text/plain; charset=utf-8')
    lines.push('')
    lines.push(parts.text)
  } else if (parts.html !== undefined) {
    lines.push('Content-Type: text/html; charset=utf-8')
    lines.push('')
    lines.push(parts.html)
  }
  const raw = lines.join('\r\n')
  return new TextEncoder().encode(raw).buffer as ArrayBuffer
}

describe('parseRawEmail', () => {
  it('prefers text/plain', async () => {
    const buf = buildMime({
      from: 'a@b.com',
      subject: 'Hi',
      text: '# Title\n\nbody',
      html: '<p>html</p>',
    })
    const parsed = await parseRawEmail(buf)
    expect(parsed.isOk()).toBe(true)
    expect(parsed._unsafeUnwrap().plainBody).toContain('# Title')
  })

  it('rejects html-only', async () => {
    const buf = buildMime({
      from: 'a@b.com',
      subject: 'Hi',
      html: '<p>only html</p>',
    })
    const parsed = await parseRawEmail(buf)
    expect(parsed.isErr()).toBe(true)
    expect(parsed._unsafeUnwrapErr().type).toBe('NoPlainBody')
  })
})

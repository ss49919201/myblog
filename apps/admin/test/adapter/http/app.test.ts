import { describe, expect, it } from 'vitest'
import app from '../../../src/adapter/http/app'

describe('POST /', () => {
  it('rerenders the form when title or body is empty', async () => {
    const res = await app.request('http://localhost/', {
      method: 'POST',
      headers: {
        origin: 'http://localhost',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ title: '', body_md: 'hello' }),
    })

    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('タイトルと本文は必須です。')
    expect(html).toContain('hello')
  })
})

import { describe, expect, it } from 'vitest'
import app from '../../../src/adapter/http/app'

describe('POST /settings/basic', () => {
  it('rerenders the form when the title is blank', async () => {
    const res = await app.request('http://localhost/settings/basic', {
      method: 'POST',
      headers: {
        origin: 'http://localhost',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ site_title: '   ' }),
    })

    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('ブログタイトルを入力してください。')
  })
})

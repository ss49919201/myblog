import { describe, expect, it } from 'vitest'
import * as v from 'valibot'
import {
  SITE_TITLE_MAX_LENGTH,
  siteTitleSchema,
} from '../../src/domain/site-title'

describe('siteTitleSchema', () => {
  it('trims whitespace and accepts a normal title', () => {
    const result = v.safeParse(siteTitleSchema, '  学習ブログ  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output).toBe('学習ブログ')
    }
  })

  it('rejects empty titles after trim', () => {
    const result = v.safeParse(siteTitleSchema, '   ')
    expect(result.success).toBe(false)
  })

  it('rejects titles longer than the max length', () => {
    const result = v.safeParse(siteTitleSchema, 'x'.repeat(SITE_TITLE_MAX_LENGTH + 1))
    expect(result.success).toBe(false)
  })
})

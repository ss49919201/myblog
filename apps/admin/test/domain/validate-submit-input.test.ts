import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import { submitPostInputSchema } from '../../src/domain/validate-submit-input'

describe('submitPostInputSchema', () => {
  const publishedAt = new Date('2026-10-12T12:00:00.000Z')

  it('passes through title and body unchanged', () => {
    const result = v.safeParse(submitPostInputSchema, {
      title: '  hello  ',
      bodyMd: '  body  ',
      publishedAt,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output.title).toBe('  hello  ')
      expect(result.output.bodyMd).toBe('  body  ')
    }
  })

  it('rejects empty title or body', () => {
    const result = v.safeParse(submitPostInputSchema, {
      title: '',
      bodyMd: 'x',
      publishedAt,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues[0].message).toBe('タイトルと本文は必須です。')
    }
  })
})

import { describe, expect, it } from 'vitest'
import { validateSubmitInput } from '../../src/domain/validate-submit-input'

describe('validateSubmitInput', () => {
  const publishedAt = new Date('2026-10-12T12:00:00.000Z')

  it('passes through title and body unchanged', () => {
    const result = validateSubmitInput({
      title: '  hello  ',
      bodyMd: '  body  ',
      publishedAt,
    })
    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value.title).toBe('  hello  ')
      expect(result.value.bodyMd).toBe('  body  ')
    }
  })

  it('rejects empty title or body', () => {
    const result = validateSubmitInput({
      title: '',
      bodyMd: 'x',
      publishedAt,
    })
    expect(result.isErr()).toBe(true)
    if (result.isErr() && result.error.type === 'ValidationError') {
      expect(result.error.message).toBe('タイトルと本文は必須です。')
    }
  })
})

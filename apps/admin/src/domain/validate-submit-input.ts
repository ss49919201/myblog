import { err, ok, type Result } from 'neverthrow'
import type { SubmitError } from './errors'

export type ValidatedSubmitInput = {
  title: string
  bodyMd: string
  publishedAt: Date
}

export type SubmitInput = {
  title: string
  bodyMd: string
  publishedAt: Date
}

export function validateSubmitInput(
  input: SubmitInput,
): Result<ValidatedSubmitInput, SubmitError> {
  const title = input.title
  const bodyMd = input.bodyMd
  if (title === '' || bodyMd === '') {
    return err({
      type: 'ValidationError',
      message: 'タイトルと本文は必須です。',
    })
  }
  return ok({
    title,
    bodyMd,
    publishedAt: input.publishedAt,
  })
}

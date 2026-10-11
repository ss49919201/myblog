import { err, ok, type Result } from 'neverthrow'
import PostalMime from 'postal-mime'
import type { IngestError } from './errors'
import { buildPostDraft, type PostDraft } from './post'

export type ParsedInboundMail = {
  from: string
  subject: string
  plainBody: string
}

export async function parseRawEmail(
  raw: ArrayBuffer,
): Promise<Result<ParsedInboundMail, IngestError>> {
  const parser = new PostalMime()
  let email: Awaited<ReturnType<PostalMime['parse']>>
  try {
    email = await parser.parse(raw)
  } catch (cause) {
    return err({ type: 'Reject', reason: 'Could not parse email' })
  }

  const from = email.from?.address
    ? email.from.name
      ? `${email.from.name} <${email.from.address}>`
      : email.from.address
    : ''
  const subject = email.subject ?? ''

  const text = email.text?.trim() ?? ''
  if (text.length > 0) {
    return ok({ from, subject, plainBody: email.text ?? '' })
  }

  const hasHtml = (email.html?.trim() ?? '').length > 0
  if (hasHtml) {
    return err({
      type: 'NoPlainBody',
      detail:
        'HTML-only messages are rejected. Send text/plain or multipart with a plain part so the body stays Markdown without embedding raw HTML.',
    })
  }

  return err({
    type: 'NoPlainBody',
    detail: 'Message has no text/plain body',
  })
}

export function mailToPostDraft(
  mail: ParsedInboundMail,
  receivedAt: Date,
  idSeed: string,
): Result<PostDraft, IngestError> {
  return buildPostDraft({
    subject: mail.subject,
    plainBody: mail.plainBody,
    receivedAt,
    idSeed,
  })
}

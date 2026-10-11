export type IngestError =
  | { type: 'Reject'; reason: string }
  | { type: 'AuthFailed'; detail: string }
  | { type: 'SenderNotAllowed'; from: string }
  | { type: 'EnvelopeFromMismatch'; headerFrom: string; envelopeFrom: string }
  | { type: 'MessageTooLarge'; size: number; limit: number }
  | { type: 'NoPlainBody'; detail: string }
  | { type: 'InvalidSlug'; slug: string; detail: string }
  | { type: 'SlugCollision'; slug: string }
  | { type: 'GitHubError'; cause: unknown }

export function rejectReason(error: IngestError): string | null {
  if (error.type === 'Reject') {
    return error.reason
  }
  switch (error.type) {
    case 'AuthFailed':
      return `Authentication failed: ${error.detail}`
    case 'SenderNotAllowed':
      return `Sender not allowed: ${error.from}`
    case 'EnvelopeFromMismatch':
      return `Envelope From does not match header From (${error.envelopeFrom} vs ${error.headerFrom})`
    case 'MessageTooLarge':
      return `Message too large (${error.size} bytes, limit ${error.limit})`
    case 'NoPlainBody':
      return error.detail
    case 'InvalidSlug':
      return `Invalid slug "${error.slug}": ${error.detail}`
    case 'SlugCollision':
      return `Post already exists for slug "${error.slug}"`
    case 'GitHubError':
      return 'GitHub API error'
  }
}

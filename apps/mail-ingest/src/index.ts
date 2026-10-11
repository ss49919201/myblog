import { rejectReason } from './domain/errors'
import { ingestEmailMessage } from './ingest'
import type { Env } from './env'

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    const receivedAt = new Date()
    const idSeed = crypto.randomUUID()

    const result = await ingestEmailMessage(message, env, receivedAt, idSeed)

    if (result.isErr()) {
      const reason = rejectReason(result.error)
      if (reason) {
        message.setReject(reason)
      } else {
        message.setReject('Message rejected')
      }
      return
    }

    console.log('Opened PR', result.value.htmlUrl)
  },
}

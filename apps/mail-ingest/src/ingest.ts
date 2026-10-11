import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import type { Result } from 'neverthrow'
import {
  formatAuthFailure,
  isMailAuthenticationValid,
  isSenderAllowed,
  parseAllowlist,
  parseAuthenticationResults,
} from './domain/auth'
import type { IngestError } from './domain/errors'
import { MAX_BODY_BYTES } from './domain/post'
import { mailToPostDraft, parseRawEmail } from './domain/mail'
import {
  createOctokit,
  ingestPostViaGitHub,
  type GitHubConfig,
  type OpenPostPrResult,
} from './github/client'
import type { Env } from './env'

export type IngestSuccess = OpenPostPrResult & { slug: string }

function collectAuthResultHeaders(headers: Headers): string[] {
  const lines: string[] = []
  for (const name of ['authentication-results', 'arc-authentication-results']) {
    for (const value of headers.getAll(name)) {
      lines.push(value)
    }
  }
  return lines
}

export function ingestEmailMessage(
  message: ForwardableEmailMessage,
  env: Env,
  receivedAt: Date,
  idSeed: string,
): ResultAsync<IngestSuccess, IngestError> {
  if (message.rawSize > MAX_BODY_BYTES) {
    return errAsync({
      type: 'MessageTooLarge',
      size: message.rawSize,
      limit: MAX_BODY_BYTES,
    })
  }

  const allowlist = parseAllowlist(env.ALLOWED_SENDERS)
  if (!isSenderAllowed(message.from, allowlist)) {
    return errAsync({ type: 'SenderNotAllowed', from: message.from })
  }

  const authLines = collectAuthResultHeaders(message.headers)
  const verdict = parseAuthenticationResults(authLines)
  if (!isMailAuthenticationValid(verdict)) {
    return errAsync({
      type: 'AuthFailed',
      detail: formatAuthFailure(verdict),
    })
  }

  const github: GitHubConfig = {
    token: env.GITHUB_TOKEN,
    owner: env.GITHUB_OWNER,
    repo: env.GITHUB_REPO,
  }
  const octokit = createOctokit(github)

  function flatten<A, E>(result: Result<A, E>): ResultAsync<A, E> {
    return result.isErr() ? errAsync(result.error) : okAsync(result.value)
  }

  return ResultAsync.fromPromise(
    new Response(message.raw).arrayBuffer(),
    () => ({ type: 'Reject', reason: 'Could not read message' }) satisfies IngestError,
  )
    .andThen((raw) =>
      ResultAsync.fromSafePromise(parseRawEmail(raw)).andThen(flatten),
    )
    .andThen((mail) => flatten(mailToPostDraft(mail, receivedAt, idSeed)))
    .andThen((draft) => {
      const branchName = `mail-ingest/${draft.slug}-${idSeed.slice(0, 8)}`
      return ingestPostViaGitHub(octokit, github, draft, branchName).map((pr) => ({
        ...pr,
        slug: draft.slug,
      }))
    })
}

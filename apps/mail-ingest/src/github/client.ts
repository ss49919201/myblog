import { Octokit } from '@octokit/rest'
import { errAsync, okAsync, ResultAsync } from 'neverthrow'
import type { IngestError } from '../domain/errors'
import { postFilePath, renderPostMarkdown, type PostDraft } from '../domain/post'

export type GitHubConfig = {
  token: string
  owner: string
  repo: string
}

export function createOctokit(config: GitHubConfig): Octokit {
  return new Octokit({ auth: config.token })
}

export function postExistsOnMain(
  octokit: Octokit,
  config: GitHubConfig,
  slug: string,
): ResultAsync<boolean, IngestError> {
  const path = postFilePath(slug)
  return ResultAsync.fromPromise(
    octokit.repos.getContent({
      owner: config.owner,
      repo: config.repo,
      path,
      ref: 'main',
    }),
    (cause) => ({ type: 'GitHubError', cause }) satisfies IngestError,
  )
    .map(() => true)
    .orElse((error) => {
      const status = (error.cause as { status?: number })?.status
      if (status === 404) {
        return okAsync(false)
      }
      return errAsync(error)
    })
}

export type OpenPostPrResult = {
  branch: string
  pullNumber: number
  htmlUrl: string
}

export function openPostPullRequest(
  octokit: Octokit,
  config: GitHubConfig,
  draft: PostDraft,
  branchName: string,
): ResultAsync<OpenPostPrResult, IngestError> {
  const path = postFilePath(draft.slug)
  const content = renderPostMarkdown(draft)
  const encoded = btoa(unescape(encodeURIComponent(content)))

  return ResultAsync.fromPromise(
    octokit.repos.getBranch({ owner: config.owner, repo: config.repo, branch: 'main' }),
    (cause) => ({ type: 'GitHubError', cause }) satisfies IngestError,
  )
    .andThen((main) =>
      ResultAsync.fromPromise(
        octokit.git.createRef({
          owner: config.owner,
          repo: config.repo,
          ref: `refs/heads/${branchName}`,
          sha: main.data.commit.sha,
        }),
        (cause) => ({ type: 'GitHubError', cause }) satisfies IngestError,
      ),
    )
    .andThen(() =>
      ResultAsync.fromPromise(
        octokit.repos.createOrUpdateFileContents({
          owner: config.owner,
          repo: config.repo,
          path,
          message: `Add post: ${draft.title}`,
          content: encoded,
          branch: branchName,
        }),
        (cause) => ({ type: 'GitHubError', cause }) satisfies IngestError,
      ),
    )
    .andThen(() =>
      ResultAsync.fromPromise(
        octokit.pulls.create({
          owner: config.owner,
          repo: config.repo,
          title: `投稿: ${draft.title}`,
          head: branchName,
          base: 'main',
          body: [
            'メール入稿から自動作成された PR です。',
            '',
            `- slug: \`${draft.slug}\``,
            `- path: \`${path}\``,
          ].join('\n'),
        }),
        (cause) => ({ type: 'GitHubError', cause }) satisfies IngestError,
      ),
    )
    .map((pr) => ({
      branch: branchName,
      pullNumber: pr.data.number,
      htmlUrl: pr.data.html_url,
    }))
}

export function ingestPostViaGitHub(
  octokit: Octokit,
  config: GitHubConfig,
  draft: PostDraft,
  branchName: string,
): ResultAsync<OpenPostPrResult, IngestError> {
  return postExistsOnMain(octokit, config, draft.slug).andThen((exists) => {
    if (exists) {
      return errAsync({ type: 'SlugCollision', slug: draft.slug } satisfies IngestError)
    }
    return openPostPullRequest(octokit, config, draft, branchName)
  })
}

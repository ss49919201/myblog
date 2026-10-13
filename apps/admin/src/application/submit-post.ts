import { errAsync, ResultAsync } from 'neverthrow'
import type { SubmitError } from '../domain/errors'
import { pickUniqueSlug } from '../domain/pick-unique-slug'
import { validateSubmitInput } from '../domain/validate-submit-input'
import type { MarkdownRenderer } from '../port/markdown-renderer'
import type { PostRepository } from '../port/post-repository'

export type SubmitPostInput = {
  title: string
  bodyMd: string
  publishedAt: Date
}

export type SubmittedPost = {
  slug: string
  title: string
  publishedAt: Date
  bodyHtml: string
  bodyMd: string
}

export type SubmitPostDeps = {
  posts: PostRepository
  markdown: MarkdownRenderer
}

export function submitPost(
  deps: SubmitPostDeps,
  input: SubmitPostInput,
): ResultAsync<SubmittedPost, SubmitError> {
  const validated = validateSubmitInput({
    title: input.title,
    bodyMd: input.bodyMd,
    publishedAt: input.publishedAt,
  })
  if (validated.isErr()) {
    return errAsync(validated.error)
  }

  const { title, bodyMd, publishedAt } = validated.value
  const bodyHtml = deps.markdown.render(bodyMd)

  return ResultAsync.fromPromise(
    pickUniqueSlug((slug) => deps.posts.slugExists(slug), title, publishedAt),
    (cause) => ({ type: 'StorageError', cause }) satisfies SubmitError,
  ).andThen((slug) =>
    ResultAsync.fromPromise(
      deps.posts.insert({
        slug,
        title,
        publishedAt,
        bodyHtml,
        bodyMd,
      }),
      (cause) => ({ type: 'StorageError', cause }) satisfies SubmitError,
    ).map(() => ({
      slug,
      title,
      publishedAt,
      bodyHtml,
      bodyMd,
    })),
  )
}

import * as v from 'valibot'

export const SITE_TITLE_MAX_LENGTH = 80

const emptyMessage = 'ブログタイトルを入力してください。'
const tooLongMessage = `ブログタイトルは ${SITE_TITLE_MAX_LENGTH} 文字以内にしてください。`

export const siteTitleSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, emptyMessage),
  v.maxLength(SITE_TITLE_MAX_LENGTH, tooLongMessage),
  v.brand('SiteTitle'),
)

export type SiteTitle = v.InferOutput<typeof siteTitleSchema>

export const updateSiteTitleInputSchema = v.pipe(
  v.object({
    siteTitle: siteTitleSchema,
  }),
  v.brand('UpdateSiteTitleInput'),
)

export type UpdateSiteTitleInput = v.InferOutput<
  typeof updateSiteTitleInputSchema
>

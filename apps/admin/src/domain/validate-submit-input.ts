import * as v from 'valibot'

const requiredFieldMessage = 'タイトルと本文は必須です。'

export const submitPostInputSchema = v.pipe(
  v.object({
    title: v.pipe(v.string(), v.minLength(1, requiredFieldMessage)),
    bodyMd: v.pipe(v.string(), v.minLength(1, requiredFieldMessage)),
    publishedAt: v.date(),
  }),
  v.brand('SubmitPostInput'),
)

export type SubmitPostInput = v.InferOutput<typeof submitPostInputSchema>

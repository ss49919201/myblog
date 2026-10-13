import { isValidSlug, slugFromTitle, slugWithSuffix } from './slug'

export async function pickUniqueSlug(
  slugExists: (slug: string) => Promise<boolean>,
  title: string,
  publishedAt: Date,
): Promise<string> {
  const base = slugFromTitle(title, publishedAt)
  if (!isValidSlug(base)) {
    throw new Error(`generated invalid slug: ${base}`)
  }
  if (!(await slugExists(base))) {
    return base
  }
  for (let n = 2; n <= 50; n++) {
    const candidate = slugWithSuffix(base, n)
    if (!(await slugExists(candidate))) {
      return candidate
    }
  }
  const fallback = slugWithSuffix(base, publishedAt.getTime())
  return fallback
}

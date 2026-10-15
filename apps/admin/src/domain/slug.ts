const FORBIDDEN_SLUG = /[\/\\\0]/g

export function isValidSlug(slug: string): boolean {
  if (slug === '' || slug === '.' || slug === '..') {
    return false
  }
  return !FORBIDDEN_SLUG.test(slug)
}

function baseSlugFromTitle(title: string): string {
  const collapsed = title.replace(/\s+/g, '-')
  const stripped = collapsed.replace(FORBIDDEN_SLUG, '').replace(/^\.+|\.+$/g, '')
  return stripped
}

export function slugFromTitle(title: string, now: Date): string {
  const base = baseSlugFromTitle(title)
  if (base.length > 0 && isValidSlug(base)) {
    return base
  }
  const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `post-${stamp}`
}

export function slugWithSuffix(base: string, suffix: number): string {
  return `${base}-${suffix}`
}

const FORBIDDEN_SLUG = /[\0/\\]/g

export function slugFromTitle(title: string): string {
  const trimmed = title.trim()
  if (trimmed.length === 0) {
    return fallbackSlug()
  }
  const collapsed = trimmed.replace(/\s+/g, ' ')
  const withoutForbidden = collapsed.replace(FORBIDDEN_SLUG, '').trim()
  if (withoutForbidden.length === 0 || withoutForbidden === '.' || withoutForbidden === '..') {
    return fallbackSlug()
  }
  return withoutForbidden
}

function fallbackSlug(): string {
  const now = new Date()
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  return `post-${stamp}`
}

export async function ensureUniqueSlug(
  db: D1Database,
  base: string,
): Promise<string> {
  let candidate = base
  let suffix = 2
  while (await slugExists(db, candidate)) {
    candidate = `${base}-${suffix}`
    suffix += 1
  }
  return candidate
}

async function slugExists(db: D1Database, slug: string): Promise<boolean> {
  const row = await db
    .prepare('SELECT 1 AS ok FROM posts WHERE slug = ?')
    .bind(slug)
    .first<{ ok: number }>()
  return row !== null
}

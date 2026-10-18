import { slugify } from './slug'

export function useSlug(title: string): string {
  return slugify(title)
}

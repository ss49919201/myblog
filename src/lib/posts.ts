import { getCollection, getEntry, type CollectionEntry } from "astro:content";

export type CategorySummary = {
  slug: string;
  name: string;
};

function isPublished(post: CollectionEntry<"posts">, now = new Date()): boolean {
  return post.data.draft !== true && post.data.date.getTime() <= now.getTime();
}

export async function publishedPosts(now = new Date()): Promise<CollectionEntry<"posts">[]> {
  const posts = await getCollection("posts", (post) => isPublished(post, now));
  posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  const seen = new Set<string>();
  for (const post of posts) {
    if (seen.has(post.data.slug)) {
      throw new Error(`Duplicate published slug: ${post.data.slug}`);
    }
    seen.add(post.data.slug);
  }

  return posts;
}

export async function categoryOf(post: CollectionEntry<"posts">): Promise<CategorySummary | null> {
  if (!post.data.category) return null;
  const category = await getEntry(post.data.category);
  if (!category) return null;
  return { slug: category.id, name: category.data.name };
}

import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { PostSummary } from "@/lib/posts";
import { CategoryLink } from "./category-link";

export function PostList({ posts }: { posts: PostSummary[] }) {
  if (posts.length === 0) {
    return <p className="text-slate-500">まだ記事がありません。</p>;
  }

  return (
    <ul className="flex flex-col gap-6">
      {posts.map((post) => (
        <li key={post.id}>
          <article>
            <div className="flex items-center gap-3">
              <time className="text-sm text-slate-500" dateTime={post.published_at ?? undefined}>
                {formatDate(post.published_at)}
              </time>
              <CategoryLink {...post} />
            </div>
            <h2 className="mt-1 text-2xl font-semibold">
              <Link href={`/posts/${post.slug}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
          </article>
        </li>
      ))}
    </ul>
  );
}

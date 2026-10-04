import Link from "next/link";
import { formatDate } from "@/lib/format";
import { listPublishedPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await listPublishedPosts();

  if (posts.length === 0) {
    return <p className="text-slate-500">まだ記事がありません。</p>;
  }

  return (
    <ul className="flex flex-col gap-6">
      {posts.map((post) => (
        <li key={post.id}>
          <article>
            <time className="text-sm text-slate-500" dateTime={post.published_at ?? undefined}>
              {formatDate(post.published_at)}
            </time>
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

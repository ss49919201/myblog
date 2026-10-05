import type { Metadata } from "next";
import { searchPublishedPosts } from "@/lib/posts";
import { PostList } from "../_components/post-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "検索" };

const MAX_QUERY_LENGTH = 100;

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, MAX_QUERY_LENGTH) ?? "";
  const posts = query ? await searchPublishedPosts(query) : [];

  return (
    <div>
      <h1 className="text-3xl font-bold">検索</h1>
      <form action="/search" className="mt-6 flex gap-2">
        <input
          type="search"
          name="q"
          defaultValue={query}
          maxLength={MAX_QUERY_LENGTH}
          placeholder="タイトル・本文から検索"
          className="flex-1 rounded border border-slate-300 bg-white px-3 py-2"
        />
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white">
          検索
        </button>
      </form>
      <div className="mt-8">
        {!query ? (
          <p className="text-slate-500">キーワードを入力してください。</p>
        ) : posts.length === 0 ? (
          <p className="text-slate-500">「{query}」に一致する記事は見つかりませんでした。</p>
        ) : (
          <>
            <p className="mb-6 text-sm text-slate-500">
              「{query}」の検索結果: {posts.length} 件
            </p>
            <PostList posts={posts} />
          </>
        )}
      </div>
    </div>
  );
}

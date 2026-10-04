import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { listAllPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "管理" };

export default async function AdminPage() {
  const posts = await listAllPosts();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">記事管理</h1>
        <Link
          href="/admin/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          新規作成
        </Link>
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-slate-500">
          <tr>
            <th className="py-2 font-medium">タイトル</th>
            <th className="py-2 font-medium">ステータス</th>
            <th className="py-2 font-medium">更新日</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border-b border-slate-100">
              <td className="py-3">
                <Link href={`/admin/posts/${post.id}`} className="font-medium hover:underline">
                  {post.title}
                </Link>
              </td>
              <td className="py-3">
                {post.status === "published" ? (
                  <span className="rounded bg-green-100 px-2 py-0.5 text-green-800">公開</span>
                ) : (
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-slate-700">下書き</span>
                )}
              </td>
              <td className="py-3 text-slate-500">{formatDate(post.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {posts.length === 0 && <p className="mt-6 text-slate-500">記事がありません。</p>}
    </div>
  );
}

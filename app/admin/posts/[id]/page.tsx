import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findPostById } from "@/lib/posts";
import { deletePostAction, updatePostAction } from "../../actions";
import { PostForm } from "../../post-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "記事の編集" };

type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
  const id = Number((await params).id);
  const post = Number.isInteger(id) ? await findPostById(id) : null;
  if (!post) notFound();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">記事の編集</h1>
        {post.status === "published" && (
          <Link href={`/posts/${post.slug}`} className="text-sm text-slate-600 underline">
            公開ページを見る
          </Link>
        )}
      </div>

      <PostForm action={updatePostAction.bind(null, post.id)} initialValues={post} submitLabel="保存" />

      <form action={deletePostAction.bind(null, post.id, post.slug)} className="mt-10 border-t border-slate-200 pt-6">
        <button type="submit" className="text-sm font-semibold text-red-600 hover:text-red-800">
          この記事を削除
        </button>
      </form>
    </div>
  );
}

import type { Metadata } from "next";
import { createPostAction } from "../actions";
import { PostForm } from "../post-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "新規作成" };

export default function NewPostPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">新規作成</h1>
      <PostForm action={createPostAction} submitLabel="作成" />
    </div>
  );
}

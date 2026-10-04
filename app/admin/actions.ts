"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createPost, deletePost, updatePost, type PostInput } from "@/lib/posts";

export type PostFormState = {
  error?: string;
  values?: PostInput;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function parsePostInput(formData: FormData): { input: PostInput; error?: string } {
  const input: PostInput = {
    slug: String(formData.get("slug") ?? "").trim(),
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? ""),
    status: formData.get("status") === "published" ? "published" : "draft",
  };

  if (!SLUG_PATTERN.test(input.slug)) {
    return { input, error: "スラッグは半角英小文字・数字・ハイフンで入力してください" };
  }
  if (input.title.length === 0 || input.title.length > 200) {
    return { input, error: "タイトルは1〜200文字で入力してください" };
  }
  if (input.body.trim().length === 0) {
    return { input, error: "本文を入力してください" };
  }
  return { input };
}

function isUniqueSlugViolation(error: unknown): boolean {
  return error instanceof Error && error.message.includes("UNIQUE constraint failed: posts.slug");
}

function revalidatePublicPages(slug: string) {
  revalidatePath("/");
  revalidatePath(`/posts/${slug}`);
}

export async function createPostAction(
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireAdmin();
  const { input, error } = parsePostInput(formData);
  if (error) return { error, values: input };

  try {
    await createPost(input);
  } catch (e) {
    if (isUniqueSlugViolation(e)) return { error: "そのスラッグは既に使われています", values: input };
    throw e;
  }

  revalidatePublicPages(input.slug);
  redirect("/admin");
}

export async function updatePostAction(
  id: number,
  _prev: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  await requireAdmin();
  const { input, error } = parsePostInput(formData);
  if (error) return { error, values: input };

  try {
    await updatePost(id, input);
  } catch (e) {
    if (isUniqueSlugViolation(e)) return { error: "そのスラッグは既に使われています", values: input };
    throw e;
  }

  revalidatePublicPages(input.slug);
  redirect("/admin");
}

export async function deletePostAction(id: number, slug: string): Promise<void> {
  await requireAdmin();
  await deletePost(id);
  revalidatePublicPages(slug);
  redirect("/admin");
}

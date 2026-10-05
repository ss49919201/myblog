import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { findCategoryBySlug, listPublishedPostsByCategory } from "@/lib/posts";
import { PostList } from "../../_components/post-list";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await findCategoryBySlug((await params).slug);
  return { title: category?.name ?? "Not Found" };
}

export default async function CategoryPage({ params }: Props) {
  const category = await findCategoryBySlug((await params).slug);
  if (!category) notFound();

  const posts = await listPublishedPostsByCategory(category.id);

  return (
    <section>
      <p className="text-sm text-slate-500">カテゴリー</p>
      <h1 className="mt-1 mb-8 text-3xl font-bold">{category.name}</h1>
      <PostList posts={posts} />
    </section>
  );
}

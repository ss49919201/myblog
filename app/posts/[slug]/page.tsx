import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDate } from "@/lib/format";
import { findPublishedPostBySlug } from "@/lib/posts";
import { CategoryLink } from "../../_components/category-link";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await findPublishedPostBySlug((await params).slug);
  return { title: post?.title ?? "Not Found" };
}

export default async function PostPage({ params }: Props) {
  const post = await findPublishedPostBySlug((await params).slug);
  if (!post) notFound();

  return (
    <article>
      <div className="flex items-center gap-3">
        <time className="text-sm text-slate-500" dateTime={post.published_at ?? undefined}>
          {formatDate(post.published_at)}
        </time>
        <CategoryLink {...post} />
      </div>
      <h1 className="mt-1 text-3xl font-bold">{post.title}</h1>
      <div className="prose prose-slate mt-8 max-w-none">
        <Markdown remarkPlugins={[remarkGfm]}>{post.body}</Markdown>
      </div>
    </article>
  );
}

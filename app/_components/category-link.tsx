import Link from "next/link";
import type { PostSummary } from "@/lib/posts";

type Props = Pick<PostSummary, "category_slug" | "category_name">;

export function CategoryLink({ category_slug, category_name }: Props) {
  if (!category_slug) return null;

  return (
    <Link
      href={`/categories/${category_slug}`}
      className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-700 hover:bg-slate-300"
    >
      {category_name}
    </Link>
  );
}

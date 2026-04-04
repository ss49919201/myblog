import Link from "next/link";
import type { Metadata } from "next";
import { getAllTags, getEntriesByTag } from "@/data/entries";

interface Props {
  params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag: encodeURIComponent(tag) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return { title: `タグ: ${decoded} | myblog` };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function excerpt(body: string, max = 100): string {
  const plain = body.replace(/#+\s/g, "").replace(/`{1,3}[^`]*`{1,3}/g, "").trim();
  return plain.length > max ? plain.slice(0, max) + "…" : plain;
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const filtered = getEntriesByTag(decoded);

  return (
    <>
      <h1 className="page-heading">{decoded}</h1>
      <p className="page-subheading">{filtered.length} 件の記事</p>
      {filtered.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontStyle: "italic" }}>記事がありません。</p>
      ) : (
        <ul className="entry-list">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <article className="entry-card">
                <h2 className="entry-card-title">
                  <Link href={`/entries/${entry.id}`}>{entry.title}</Link>
                </h2>
                <p className="entry-card-meta">{formatDate(entry.publishedAt)}</p>
                <p className="entry-card-excerpt">{excerpt(entry.body)}</p>
                <div className="tags">
                  {entry.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/tags/${encodeURIComponent(t)}`}
                      className="tag"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
      <p className="back-link">
        <Link href="/">← すべての記事に戻る</Link>
      </p>
    </>
  );
}

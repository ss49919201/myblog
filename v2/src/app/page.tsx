import Link from "next/link";
import { entries } from "@/data/entries";

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

export default function HomePage() {
  return (
    <>
      <h1 className="page-heading">Articles</h1>
      <ul className="entry-list">
        {entries.map((entry) => (
          <li key={entry.id}>
            <article className="entry-card">
              <h2 className="entry-card-title">
                <Link href={`/entries/${entry.id}`}>{entry.title}</Link>
              </h2>
              <p className="entry-card-meta">{formatDate(entry.publishedAt)}</p>
              <p className="entry-card-excerpt">{excerpt(entry.body)}</p>
              <div className="tags">
                {entry.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className="tag"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </>
  );
}

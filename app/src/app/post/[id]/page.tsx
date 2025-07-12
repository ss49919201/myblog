import { getPost } from "@/query/post";
import { notFound } from "next/navigation";
import Link from "next/link";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
      <nav style={{ marginBottom: "2rem" }}>
        <Link
          href="/"
          style={{
            color: "#666",
            textDecoration: "none",
            fontSize: "1rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          ← ホームに戻る
        </Link>
      </nav>

      <article>
        <header style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
              color: "#333",
              lineHeight: "1.2",
              marginBottom: "1rem",
            }}
          >
            {post.title}
          </h1>
        </header>

        <div
          style={{
            fontSize: "1.1rem",
            lineHeight: "1.8",
            color: "#444",
            whiteSpace: "pre-wrap",
          }}
        >
          {post.body}
        </div>
      </article>
    </div>
  );
}
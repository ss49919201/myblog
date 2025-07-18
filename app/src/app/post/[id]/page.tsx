import { getPost } from "@/query/post";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { createLogger } from "@/logger";
import PostTags from "@/components/PostTags";

interface PostPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const logger = createLogger({ component: 'PostPage', postId: id });
  
  logger.info(`Rendering post page for ID: ${id}`);
  
  const post = await getPost(id);

  if (!post) {
    logger.warn(`Post not found, returning 404: ${id}`);
    notFound();
  }
  
  logger.info(`Successfully rendered post: ${post.title}`);

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
          <PostTags tags={post.tags || []} />
        </header>

        <div
          style={{
            fontSize: "1.1rem",
            lineHeight: "1.8",
            color: "#444",
          }}
        >
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 style={{ fontSize: "2rem", marginBottom: "1rem", color: "#333" }}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 style={{ fontSize: "1.5rem", marginBottom: "0.8rem", marginTop: "2rem", color: "#333" }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.6rem", marginTop: "1.5rem", color: "#333" }}>
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p style={{ marginBottom: "1rem" }}>{children}</p>
              ),
              code: ({ children }) => (
                <code style={{ 
                  backgroundColor: "#f1f1f1", 
                  padding: "2px 4px", 
                  borderRadius: "3px",
                  fontFamily: "monospace"
                }}>
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre style={{ 
                  backgroundColor: "#f8f8f8", 
                  padding: "1rem", 
                  borderRadius: "5px",
                  overflow: "auto",
                  marginBottom: "1rem"
                }}>
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote style={{ 
                  borderLeft: "4px solid #ddd", 
                  paddingLeft: "1rem", 
                  margin: "1rem 0",
                  color: "#666"
                }}>
                  {children}
                </blockquote>
              ),
              ul: ({ children }) => (
                <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem" }}>
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol style={{ marginBottom: "1rem", paddingLeft: "1.5rem" }}>
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li style={{ marginBottom: "0.25rem" }}>{children}</li>
              ),
            }}
          >
            {post.body}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
import styles from "./page.module.css";
import { searchPosts } from "@/query/post";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { createLogger } from "@/logger";

export default async function Home() {
  const logger = createLogger({ component: 'HomePage' });
  
  logger.info('Rendering home page');
  const posts = await searchPosts();
  logger.info(`Home page rendered with ${posts.length} posts`);

  return (
    <div className={styles.page}>
      <header
        style={{
          textAlign: "center",
          padding: "2rem 0",
          borderBottom: "2px solid #e0e0e0",
          marginBottom: "2rem",
        }}
      >
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "bold",
            color: "#333",
            margin: 0,
            marginBottom: "0.5rem",
          }}
        >
          My Blog
        </h1>
        <p
          style={{
            fontSize: "1.2rem",
            color: "#666",
            margin: 0,
          }}
        >
          技術とアイデアを共有する場所
        </p>
      </header>

      <main className={styles.main}>
        {posts.length > 0 ? (
          <div>
            <h2 style={{ marginBottom: "1.5rem", color: "#333" }}>
              最新の投稿
            </h2>
            {posts.map((post) => (
              <article
                key={post.id}
                style={{
                  marginBottom: "2rem",
                  padding: "1.5rem",
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "box-shadow 0.2s",
                }}
              >
                <Link
                  href={`/post/${post.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <h2
                    style={{
                      marginBottom: "1rem",
                      color: "#333",
                      fontSize: "1.5rem",
                      cursor: "pointer",
                    }}
                  >
                    {post.title}
                  </h2>
                </Link>
                <div
                  style={{
                    color: "#666",
                    lineHeight: "1.6",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <span>{children} </span>,
                      h1: ({ children }) => <span style={{ fontWeight: "bold" }}>{children} </span>,
                      h2: ({ children }) => <span style={{ fontWeight: "bold" }}>{children} </span>,
                      h3: ({ children }) => <span style={{ fontWeight: "bold" }}>{children} </span>,
                      h4: ({ children }) => <span style={{ fontWeight: "bold" }}>{children} </span>,
                      h5: ({ children }) => <span style={{ fontWeight: "bold" }}>{children} </span>,
                      h6: ({ children }) => <span style={{ fontWeight: "bold" }}>{children} </span>,
                      code: ({ children }) => <span style={{ fontFamily: "monospace" }}>{children}</span>,
                      pre: ({ children }) => <span style={{ fontFamily: "monospace" }}>{children}</span>,
                      strong: ({ children }) => <span style={{ fontWeight: "bold" }}>{children}</span>,
                      em: ({ children }) => <span style={{ fontStyle: "italic" }}>{children}</span>,
                      ul: ({ children }) => <span>{children}</span>,
                      ol: ({ children }) => <span>{children}</span>,
                      li: ({ children }) => <span>• {children} </span>,
                      blockquote: ({ children }) => <span>{children} </span>,
                      a: ({ children }) => <span>{children}</span>,
                    }}
                  >
                    {post.body}
                  </ReactMarkdown>
                </div>
                <div style={{ marginTop: "1rem" }}>
                  <Link
                    href={`/post/${post.id}`}
                    style={{
                      color: "#0070f3",
                      textDecoration: "none",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                    }}
                  >
                    続きを読む →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>投稿が見つかりませんでした</p>
        )}
      </main>
      <footer
        style={{
          borderTop: "2px solid #e0e0e0",
          marginTop: "3rem",
          padding: "2rem 0",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "2rem",
            marginBottom: "1rem",
            flexWrap: "wrap",
          }}
        >
          <a
            href="#"
            style={{
              color: "#666",
              textDecoration: "none",
              fontSize: "1rem",
              transition: "color 0.2s",
            }}
          >
            About
          </a>
          <a
            href="#"
            style={{
              color: "#666",
              textDecoration: "none",
              fontSize: "1rem",
              transition: "color 0.2s",
            }}
          >
            Contact
          </a>
        </div>
        <p
          style={{
            margin: 0,
            color: "#999",
            fontSize: "0.9rem",
          }}
        >
          © 2025 My Blog. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

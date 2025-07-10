import styles from "./page.module.css";
import { searchPosts } from "@/query/post";

export default async function Home() {
  const posts = await searchPosts();

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
                  padding: "1rem",
                  border: "1px solid #ccc",
                }}
              >
                <h2>{post.title}</h2>
                <div>{post.body}</div>
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

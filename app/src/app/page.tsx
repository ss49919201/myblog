import Image from "next/image";
import styles from "./page.module.css";
import { searchPosts } from "@/query/post";

export default async function Home() {
  const posts = await searchPosts();

  return (
    <div className={styles.page}>
      <header style={{ 
        textAlign: 'center', 
        padding: '2rem 0', 
        borderBottom: '2px solid #e0e0e0', 
        marginBottom: '2rem' 
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#333', 
          margin: 0,
          marginBottom: '0.5rem'
        }}>
          My Blog
        </h1>
        <p style={{ 
          fontSize: '1.2rem', 
          color: '#666', 
          margin: 0 
        }}>
          技術とアイデアを共有する場所
        </p>
      </header>

      <main className={styles.main}>
        {posts.length > 0 ? (
          <div>
            <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>最新の投稿</h2>
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
      <footer className={styles.footer}>
        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}

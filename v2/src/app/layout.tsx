import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "myblog",
  description: "日常と技術のブログ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <header>
          <div className="header-inner">
            <Link href="/" className="site-title">
              myblog
            </Link>
            <p className="site-tagline">日常と技術の記録</p>
            <nav>
              <Link href="/">記事一覧</Link>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer>
          <p>© 2026 myblog</p>
        </footer>
      </body>
    </html>
  );
}

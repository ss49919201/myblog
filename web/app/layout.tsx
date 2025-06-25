import type { Metadata, Viewport } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: {
    default: 'MyBlog',
    template: '%s | MyBlog',
  },
  description: 'シンプルなブログアプリケーション',
  keywords: ['ブログ', '投稿', 'Next.js', 'TypeScript'],
  authors: [{ name: 'MyBlog Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="font-mono">
        <div className="min-h-screen">
          <nav className="retro-nav">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-20">
                <div className="flex items-center">
                  <Link href="/" className="retro-title text-3xl">
                    📺 RETRO BLOG
                  </Link>
                </div>
                <div className="flex items-center space-x-6">
                  <Link 
                    href="/" 
                    className="retro-link px-4 py-2 text-lg"
                  >
                    &gt; 投稿一覧
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-retro-yellow opacity-50 animate-pulse"></div>
            {children}
          </main>
          <footer className="retro-nav mt-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="text-center">
                <p className="retro-link text-sm">
                  © 2024 RETRO BLOG | Powered by Next.js &amp; TypeScript
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
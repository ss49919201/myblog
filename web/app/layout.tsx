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
            <div className="max-w-4xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16 xs:h-18 sm:h-20">
                <div className="flex items-center min-w-0 flex-1">
                  <Link href="/" className="retro-title text-lg xs:text-xl sm:text-2xl lg:text-3xl truncate">
                    <span className="hidden xs:inline">📺 RETRO BLOG</span>
                    <span className="xs:hidden">📺 BLOG</span>
                  </Link>
                </div>
                <div className="flex items-center ml-4">
                  <Link 
                    href="/" 
                    className="retro-link px-2 xs:px-3 sm:px-4 py-1 xs:py-2 text-xs xs:text-sm sm:text-base lg:text-lg whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">&gt; 投稿一覧</span>
                    <span className="sm:hidden">&gt; 一覧</span>
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-4xl mx-auto py-4 xs:py-6 sm:py-8 px-2 xs:px-4 sm:px-6 lg:px-8 relative">
            <div className="absolute top-0 left-0 w-full h-0.5 sm:h-1 bg-retro-yellow opacity-50 animate-pulse"></div>
            {children}
          </main>
          <footer className="retro-nav mt-8 sm:mt-12">
            <div className="max-w-4xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
              <div className="text-center">
                <p className="retro-link text-xs xs:text-sm">
                  <span className="hidden sm:inline">© 2024 RETRO BLOG | Powered by Next.js &amp; TypeScript</span>
                  <span className="sm:hidden">© 2024 RETRO BLOG</span>
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
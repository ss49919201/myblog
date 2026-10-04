import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "myblog", template: "%s | myblog" },
  description: "Next.js + Cloudflare Workers + D1 で動くブログ",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-3xl px-6 py-4">
            <Link href="/" className="text-xl font-bold tracking-tight">
              myblog
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
        <footer className="mx-auto max-w-3xl px-6 pb-10 text-center text-xs text-slate-400">
          Powered by vinext · Cloudflare Workers · D1
        </footer>
      </body>
    </html>
  );
}

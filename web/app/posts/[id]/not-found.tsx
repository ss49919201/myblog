import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="px-4 sm:px-0 text-center py-12">
      <div className="retro-card p-8 max-w-2xl mx-auto bg-retro-pink">
        <div className="text-6xl mb-6">📄</div>
        <h1 className="retro-title text-4xl mb-6 text-retro-dark">
          POST NOT FOUND
        </h1>
        <div className="retro-text mb-6 text-retro-dark">
          &gt; 指定された投稿は存在しません
        </div>
        <div className="retro-text text-sm mb-8 opacity-70">
          {/* 投稿IDを確認してください */}
          {"// POST ID NOT EXISTS"}
        </div>
        <Link 
          href="/"
          className="retro-button bg-retro-dark text-retro-cream"
        >
          📋 BACK TO POSTS
        </Link>
      </div>
    </div>
  );
}
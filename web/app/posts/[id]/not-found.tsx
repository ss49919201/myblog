import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="px-2 xs:px-4 sm:px-0 text-center py-8 sm:py-12">
      <div className="retro-mobile-card retro-card max-w-sm sm:max-w-2xl mx-auto bg-retro-pink">
        <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">📄</div>
        <h1 className="retro-title text-xl xs:text-2xl sm:text-4xl mb-4 sm:mb-6 text-retro-dark">
          POST NOT FOUND
        </h1>
        <div className="retro-text mb-4 sm:mb-6 text-retro-dark text-sm sm:text-base">
          &gt; 指定された投稿は存在しません
        </div>
        <div className="retro-text text-xs sm:text-sm mb-6 sm:mb-8 opacity-70">
          {/* 投稿IDを確認してください */}
          {"// POST ID NOT EXISTS"}
        </div>
        <Link 
          href="/"
          className="retro-button bg-retro-dark text-retro-cream text-xs sm:text-base"
        >
          <span className="hidden xs:inline">📋 BACK TO POSTS</span>
          <span className="xs:hidden">📋 POSTS</span>
        </Link>
      </div>
    </div>
  );
}
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="px-2 xs:px-4 sm:px-0 text-center py-8 sm:py-12">
      <div className="retro-mobile-card retro-card max-w-sm sm:max-w-2xl mx-auto bg-retro-yellow">
        <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">🔍</div>
        <h1 className="retro-title text-2xl xs:text-3xl sm:text-4xl mb-4 sm:mb-6 text-retro-dark">
          404 NOT FOUND
        </h1>
        <div className="retro-text mb-4 sm:mb-6 text-retro-brown text-sm sm:text-base">
          &gt; 指定されたページは存在しません
        </div>
        <div className="retro-text text-xs sm:text-sm mb-6 sm:mb-8 opacity-70">
          {/* URLを確認してください */}
          {"// CHECK URL PATH"}
        </div>
        <Link 
          href="/"
          className="retro-button bg-retro-dark text-retro-cream text-xs sm:text-base"
        >
          <span className="hidden xs:inline">🏠 GO HOME</span>
          <span className="xs:hidden">🏠 HOME</span>
        </Link>
      </div>
    </div>
  );
}
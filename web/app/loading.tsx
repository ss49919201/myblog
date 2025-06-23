export default function Loading() {
  return (
    <div className="flex justify-center items-center py-12 sm:py-16">
      <div className="retro-mobile-card retro-card text-center bg-retro-dark text-retro-cream max-w-sm mx-auto">
        <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">💾</div>
        <h2 className="retro-title text-xl sm:text-2xl mb-3 sm:mb-4 text-retro-yellow">
          LOADING...
        </h2>
        <div className="retro-text mb-4 sm:mb-6 text-sm sm:text-base">
          <span className="hidden sm:inline">&gt; システムからデータを取得中</span>
          <span className="sm:hidden">&gt; データ取得中</span>
        </div>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-retro-orange rounded-full animate-pulse"></div>
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-retro-yellow rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-retro-green rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <div className="retro-text text-xs mt-3 sm:mt-4 opacity-50">
          PLEASE WAIT...
        </div>
      </div>
    </div>
  );
}
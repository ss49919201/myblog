export default function Loading() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="retro-card p-8 text-center bg-retro-dark text-retro-cream">
        <div className="text-4xl mb-4">💾</div>
        <h2 className="retro-title text-2xl mb-4 text-retro-yellow">
          LOADING...
        </h2>
        <div className="retro-text mb-6">
          &gt; システムからデータを取得中
        </div>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-retro-orange rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-retro-yellow rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-retro-green rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <div className="retro-text text-xs mt-4 opacity-50">
          PLEASE WAIT...
        </div>
      </div>
    </div>
  );
}
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="px-4 sm:px-0 text-center py-12">
      <div className="retro-card p-8 max-w-2xl mx-auto bg-retro-yellow">
        <div className="text-6xl mb-6">🔍</div>
        <h1 className="retro-title text-4xl mb-6 text-retro-dark">
          404 NOT FOUND
        </h1>
        <div className="retro-text mb-6 text-retro-brown">
          &gt; 指定されたページは存在しません
        </div>
        <div className="retro-text text-sm mb-8 opacity-70">
          {/* URLを確認してください */}
          {"// CHECK URL PATH"}
        </div>
        <Link 
          href="/"
          className="retro-button bg-retro-dark text-retro-cream"
        >
          🏠 GO HOME
        </Link>
      </div>
    </div>
  );
}
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="px-4 sm:px-0 text-center py-12">
      <div className="retro-card p-8 max-w-2xl mx-auto bg-retro-dark text-retro-cream">
        <div className="text-6xl mb-6">💥</div>
        <h1 className="retro-title text-3xl mb-6 text-retro-orange">
          SYSTEM ERROR
        </h1>
        <div className="retro-text mb-6 bg-retro-orange bg-opacity-20 p-4 border-l-4 border-retro-orange">
          <div className="font-bold mb-2">&gt; ERROR MESSAGE:</div>
          <pre className="text-sm whitespace-pre-wrap">
{error.message}
          </pre>
        </div>
        <div className="retro-text text-sm mb-6 opacity-70">
          システムで予期しないエラーが発生しました
        </div>
        <button
          onClick={reset}
          className="retro-button bg-retro-orange text-retro-dark"
        >
          🔄 RETRY OPERATION
        </button>
      </div>
    </div>
  );
}
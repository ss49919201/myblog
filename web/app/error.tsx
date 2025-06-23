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
    <div className="px-2 xs:px-4 sm:px-0 text-center py-8 sm:py-12">
      <div className="retro-mobile-card retro-card max-w-sm sm:max-w-2xl mx-auto bg-retro-dark text-retro-cream">
        <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">💥</div>
        <h1 className="retro-title text-2xl xs:text-3xl mb-4 sm:mb-6 text-retro-orange">
          SYSTEM ERROR
        </h1>
        <div className="retro-text mb-4 sm:mb-6 bg-retro-orange bg-opacity-20 p-3 sm:p-4 border-l-2 sm:border-l-4 border-retro-orange">
          <div className="font-bold mb-2 text-xs sm:text-base">&gt; ERROR MESSAGE:</div>
          <pre className="text-xs sm:text-sm whitespace-pre-wrap break-words overflow-auto">
{error.message}
          </pre>
        </div>
        <div className="retro-text text-xs sm:text-sm mb-4 sm:mb-6 opacity-70">
          システムで予期しないエラーが発生しました
        </div>
        <button
          onClick={reset}
          className="retro-button bg-retro-orange text-retro-dark text-xs sm:text-base"
        >
          <span className="hidden xs:inline">🔄 RETRY OPERATION</span>
          <span className="xs:hidden">🔄 RETRY</span>
        </button>
      </div>
    </div>
  );
}
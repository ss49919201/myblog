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
    <div className="px-4 sm:px-0">
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-700">
          エラーが発生しました: {error.message}
        </div>
      </div>
      <div className="mt-4">
        <button
          onClick={reset}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          再試行
        </button>
      </div>
    </div>
  );
}
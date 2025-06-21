import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="px-4 sm:px-0">
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="text-yellow-700">
          ページが見つかりません
        </div>
      </div>
      <div className="mt-4">
        <Link 
          href="/"
          className="text-blue-600 hover:text-blue-500"
        >
          ← ホームに戻る
        </Link>
      </div>
    </div>
  );
}
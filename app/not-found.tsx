import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">ページが見つかりません</h1>
      <Link href="/" className="mt-4 inline-block text-sm text-slate-600 underline">
        トップへ戻る
      </Link>
    </div>
  );
}

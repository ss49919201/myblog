'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import PostForm from '@/components/PostForm';

export default function NewPost() {
  const router = useRouter();

  const handleSubmit = async (data: { title: string; body: string; publishdAt: string | null }) => {
    await api.createPost(data);
    router.push('/');
  };

  return (
    <div>
      <div className="mb-6 px-4 sm:px-0">
        <Link 
          href="/"
          className="text-blue-600 hover:text-blue-500 text-sm font-medium"
        >
          ← 投稿一覧に戻る
        </Link>
      </div>

      <div className="mb-8 px-4 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900">新規投稿</h1>
        <p className="mt-2 text-sm text-gray-700">
          新しいブログ投稿を作成します
        </p>
      </div>

      <PostForm 
        onSubmit={handleSubmit}
        submitLabel="投稿を作成"
      />
    </div>
  );
}
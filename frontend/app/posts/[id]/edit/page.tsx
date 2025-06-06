'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Post } from '@/types/api';
import PostForm from '@/components/PostForm';

export default function EditPost() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postData = await api.getPost(id);
        setPost(postData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch post');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPost();
    }
  }, [id]);

  const handleSubmit = async (data: { title: string; body: string; publishdAt: string | null }) => {
    if (!post) return;
    
    await api.updatePost(post.id, data);
    router.push(`/posts/${post.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="px-4 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">エラー: {error || '投稿が見つかりません'}</div>
        </div>
        <div className="mt-4">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-500"
          >
            ← 投稿一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 px-4 sm:px-0">
        <Link 
          href={`/posts/${post.id}`}
          className="text-blue-600 hover:text-blue-500 text-sm font-medium"
        >
          ← 投稿詳細に戻る
        </Link>
      </div>

      <div className="mb-8 px-4 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900">投稿を編集</h1>
        <p className="mt-2 text-sm text-gray-700">
          「{post.title}」を編集しています
        </p>
      </div>

      <PostForm 
        post={post}
        onSubmit={handleSubmit}
        submitLabel="変更を保存"
      />
    </div>
  );
}
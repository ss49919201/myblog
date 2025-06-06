'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Post } from '@/types/api';

interface PostFormProps {
  post?: Post;
  onSubmit: (data: { title: string; body: string; publishdAt: string | null }) => Promise<void>;
  submitLabel: string;
}

export default function PostForm({ post, onSubmit, submitLabel }: PostFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title || '');
  const [body, setBody] = useState(post?.body || '');
  const [isPublished, setIsPublished] = useState(!!post?.publishdAt);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !body.trim()) {
      alert('タイトルと本文を入力してください');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        body: body.trim(),
        publishdAt: isPublished ? new Date().toISOString() : null,
      });
    } catch (err) {
      alert('保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 sm:px-0">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              タイトル
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="投稿のタイトルを入力"
              required
            />
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium text-gray-700">
              本文
            </label>
            <textarea
              id="body"
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="投稿の内容を入力"
              required
            />
          </div>

          <div className="flex items-center">
            <input
              id="published"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="published" className="ml-2 block text-sm text-gray-700">
              すぐに公開する
            </label>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? '保存中...' : submitLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
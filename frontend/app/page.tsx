'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Post } from '@/types/api';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postList = await api.getPosts();
        setPosts(postList.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('この投稿を削除しますか？')) {
      return;
    }

    try {
      await api.deletePost(id);
      setPosts(posts.filter(post => post.id !== id));
    } catch (err) {
      alert('削除に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-700">エラー: {error}</div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">ブログ投稿一覧</h1>
          <p className="mt-2 text-sm text-gray-700">
            すべての投稿を表示しています
          </p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500">投稿がありません</div>
          <Link 
            href="/posts/new"
            className="mt-2 inline-block text-blue-600 hover:text-blue-500"
          >
            最初の投稿を作成する
          </Link>
        </div>
      ) : (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          <Link 
                            href={`/posts/${post.id}`}
                            className="hover:text-blue-600"
                          >
                            {post.title}
                          </Link>
                        </h3>
                        <p className="mt-2 text-gray-600 line-clamp-3">
                          {post.body.length > 150 
                            ? `${post.body.substring(0, 150)}...` 
                            : post.body
                          }
                        </p>
                        <div className="mt-4 text-sm text-gray-500">
                          {post.publishdAt 
                            ? `公開日: ${new Date(post.publishdAt).toLocaleDateString('ja-JP')}`
                            : '下書き'
                          }
                        </div>
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <Link
                          href={`/posts/${post.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                        >
                          編集
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
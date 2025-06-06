'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Post, AnalyzeResult } from '@/types/api';

export default function PostDetail() {
  const params = useParams();
  const id = params.id as string;
  
  const [post, setPost] = useState<Post | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
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

  const handleAnalyze = async () => {
    if (!post) return;
    
    setAnalyzing(true);
    try {
      const result = await api.analyzePost(post.id);
      setAnalysis(result);
    } catch (err) {
      alert('分析に失敗しました');
    } finally {
      setAnalyzing(false);
    }
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
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <Link 
          href="/"
          className="text-blue-600 hover:text-blue-500 text-sm font-medium"
        >
          ← 投稿一覧に戻る
        </Link>
      </div>

      <article className="bg-white rounded-lg shadow-sm border p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              {post.publishdAt 
                ? `公開日: ${new Date(post.publishdAt).toLocaleDateString('ja-JP')}`
                : '下書き'
              }
            </div>
            <div className="space-x-4">
              <Link
                href={`/posts/${post.id}/edit`}
                className="text-blue-600 hover:text-blue-900 font-medium"
              >
                編集
              </Link>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="text-green-600 hover:text-green-900 font-medium disabled:opacity-50"
              >
                {analyzing ? '分析中...' : '投稿を分析'}
              </button>
            </div>
          </div>
        </header>

        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {post.body}
          </div>
        </div>
      </article>

      {analysis && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-green-900 mb-4">分析結果</h3>
          <div className="text-green-800 whitespace-pre-wrap">
            {analysis.analysis}
          </div>
        </div>
      )}
    </div>
  );
}
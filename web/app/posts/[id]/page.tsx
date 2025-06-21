import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverApi } from '@/lib/api';
import { Post } from '@/types/api';
import { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const post = await serverApi.getPost(id);
    return {
      title: post.title,
      description: post.body.length > 150 
        ? `${post.body.substring(0, 150)}...` 
        : post.body,
    };
  } catch {
    return {
      title: '投稿が見つかりません',
      description: '指定された投稿は存在しません',
    };
  }
}

function BackLink() {
  return (
    <div className="mb-6">
      <Link 
        href="/"
        className="text-blue-600 hover:text-blue-500 text-sm font-medium"
      >
        ← 投稿一覧に戻る
      </Link>
    </div>
  );
}

function PostContent({ post }: { post: Post }) {
  const publishDate = post.publishdAt 
    ? `公開日: ${new Date(post.publishdAt).toLocaleDateString('ja-JP')}`
    : '下書き';

  return (
    <article className="bg-white rounded-lg shadow-sm border p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>
        <div className="text-sm text-gray-500">
          {publishDate}
        </div>
      </header>
      <div className="prose max-w-none">
        <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
          {post.body}
        </div>
      </div>
    </article>
  );
}

export default async function PostDetail({ params }: Props) {
  const { id } = await params;
  let post: Post;
  
  try {
    post = await serverApi.getPost(id);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      notFound();
    }
    throw error; // Re-throw other errors to be handled by error.tsx
  }

  return (
    <div className="px-4 sm:px-0">
      <BackLink />
      <PostContent post={post} />
    </div>
  );
}
import Link from 'next/link';
import { serverApi } from '@/lib/api';
import { Post } from '@/types/api';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ブログ投稿一覧',
  description: 'すべての投稿を表示しています',
};

function EmptyState() {
  return (
    <div className="text-center py-8">
      <div className="text-gray-500">投稿がありません</div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const truncatedBody = post.body.length > 150 
    ? `${post.body.substring(0, 150)}...` 
    : post.body;
  
  const publishDate = post.publishdAt 
    ? `公開日: ${new Date(post.publishdAt).toLocaleDateString('ja-JP')}`
    : '下書き';

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-medium text-gray-900">
        <Link 
          href={`/posts/${post.id}`}
          className="hover:text-blue-600"
        >
          {post.title}
        </Link>
      </h3>
      <p className="mt-2 text-gray-600 line-clamp-3">
        {truncatedBody}
      </p>
      <div className="mt-4 text-sm text-gray-500">
        {publishDate}
      </div>
    </div>
  );
}

export default async function Home() {
  const postList = await serverApi.getPosts();
  const posts = postList.items;

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
        <EmptyState />
      ) : (
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div className="space-y-4">
                {posts.map((post) => <PostCard key={post.id} post={post} />)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
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
    <div className="text-center py-12">
      <div className="retro-card p-8 max-w-md mx-auto">
        <div className="text-6xl mb-4">🕳️</div>
        <div className="retro-text text-xl">
          &gt; NO POSTS FOUND
        </div>
        <div className="retro-text text-sm mt-2 opacity-70">
          {/* まだ投稿がありません */}
          {"// DATABASE EMPTY"}
        </div>
      </div>
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
    <article className="retro-card p-6 mb-6 hover:shadow-2xl transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="text-retro-orange text-xs font-bold bg-retro-dark px-2 py-1">
          &gt; POST_{post.id.substring(0, 8).toUpperCase()}
        </div>
        <div className="text-retro-brown text-xs retro-text">
          {publishDate}
        </div>
      </div>
      
      <h2 className="retro-title text-2xl mb-4 hover:text-retro-orange transition-colors">
        <Link 
          href={`/posts/${post.id}`}
          className="block hover:translate-x-2 transition-transform duration-200"
        >
          📄 {post.title}
        </Link>
      </h2>
      
      <div className="retro-text mb-4 p-4 bg-retro-dark bg-opacity-5 border-l-4 border-retro-orange">
        <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
{truncatedBody}
        </pre>
      </div>
      
      <div className="flex justify-end">
        <Link 
          href={`/posts/${post.id}`}
          className="retro-button text-sm"
        >
          READ MORE &gt;&gt;
        </Link>
      </div>
    </article>
  );
}

export default async function Home() {
  const postList = await serverApi.getPosts();
  const posts = postList.items;

  return (
    <div className="px-4 sm:px-0">
      <header className="mb-12 text-center">
        <div className="retro-card p-8 bg-gradient-to-r from-retro-cream to-retro-yellow">
          <h1 className="retro-title text-5xl mb-4">
            💾 BLOG POSTS
          </h1>
          <p className="retro-text text-lg">
            &gt; システム内の全投稿データを表示中...
          </p>
          <div className="mt-4 flex justify-center items-center space-x-2">
            <div className="w-3 h-3 bg-retro-green rounded-full animate-pulse"></div>
            <div className="retro-text text-sm">CONNECTED</div>
          </div>
        </div>
      </header>

      <section>
        {posts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            <div className="retro-text text-center mb-8">
              <span className="bg-retro-dark text-retro-yellow px-4 py-2 font-bold">
                FOUND: {posts.length} POSTS
              </span>
            </div>
            
            {posts.map((post, index) => (
              <div key={post.id} className="relative">
                <div className="absolute -left-8 top-4 text-retro-brown font-bold text-xl opacity-30">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-12 text-center retro-text opacity-50">
        <div className="inline-block border-2 border-retro-dark p-2">
          ■ END OF DATA ■
        </div>
      </div>
    </div>
  );
}
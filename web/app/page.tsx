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
    <div className="text-center py-8 sm:py-12">
      <div className="retro-mobile-card retro-card max-w-sm sm:max-w-md mx-auto">
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🕳️</div>
        <div className="retro-text text-lg sm:text-xl">
          &gt; NO POSTS FOUND
        </div>
        <div className="retro-text text-xs sm:text-sm mt-2 opacity-70">
          {/* まだ投稿がありません */}
          {"// DATABASE EMPTY"}
        </div>
      </div>
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const truncatedBody = post.body.length > 100 
    ? `${post.body.substring(0, 100)}...` 
    : post.body;
  
  const publishDate = post.publishdAt 
    ? `公開日: ${new Date(post.publishdAt).toLocaleDateString('ja-JP')}`
    : '下書き';

  return (
    <article className="retro-mobile-card retro-card mb-4 sm:mb-6 hover:shadow-2xl transition-all duration-300">
      <div className="flex flex-col xs:flex-row xs:items-start justify-between mb-3 sm:mb-4 space-y-2 xs:space-y-0">
        <div className="text-retro-orange text-xs font-bold bg-retro-dark px-2 py-1 inline-block xs:inline">
          &gt; POST_{post.id.substring(0, 6).toUpperCase()}
        </div>
        <div className="text-retro-brown retro-mobile-text">
          {publishDate}
        </div>
      </div>
      
      <h2 className="retro-title text-lg xs:text-xl sm:text-2xl mb-3 sm:mb-4 hover:text-retro-orange transition-colors leading-tight">
        <Link 
          href={`/posts/${post.id}`}
          className="block hover:translate-x-1 sm:hover:translate-x-2 transition-transform duration-200"
        >
          📄 {post.title}
        </Link>
      </h2>
      
      <div className="retro-text mb-3 sm:mb-4 p-3 sm:p-4 bg-retro-dark bg-opacity-5 border-l-2 sm:border-l-4 border-retro-orange">
        <pre className="whitespace-pre-wrap font-mono text-xs xs:text-sm sm:text-sm leading-relaxed overflow-hidden">
{truncatedBody}
        </pre>
      </div>
      
      <div className="flex justify-end">
        <Link 
          href={`/posts/${post.id}`}
          className="retro-button text-xs sm:text-sm"
        >
          <span className="hidden xs:inline">READ MORE &gt;&gt;</span>
          <span className="xs:hidden">READ &gt;</span>
        </Link>
      </div>
    </article>
  );
}

export default async function Home() {
  const postList = await serverApi.getPosts();
  const posts = postList.items;

  return (
    <div className="px-2 xs:px-4 sm:px-0">
      <header className="mb-8 sm:mb-12 text-center">
        <div className="retro-mobile-card retro-card bg-gradient-to-r from-retro-cream to-retro-yellow">
          <h1 className="retro-title text-3xl xs:text-4xl sm:text-5xl mb-3 sm:mb-4 leading-tight">
            <span className="hidden xs:inline">💾 BLOG POSTS</span>
            <span className="xs:hidden">💾 POSTS</span>
          </h1>
          <p className="retro-text text-sm xs:text-base sm:text-lg">
            <span className="hidden sm:inline">&gt; システム内の全投稿データを表示中...</span>
            <span className="sm:hidden">&gt; 投稿データ表示中...</span>
          </p>
          <div className="mt-3 sm:mt-4 flex justify-center items-center space-x-2">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-retro-green rounded-full animate-pulse"></div>
            <div className="retro-text text-xs sm:text-sm">CONNECTED</div>
          </div>
        </div>
      </header>

      <section>
        {posts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="retro-text text-center mb-6 sm:mb-8">
              <span className="bg-retro-dark text-retro-yellow px-3 sm:px-4 py-1 sm:py-2 font-bold text-xs sm:text-base">
                FOUND: {posts.length} POSTS
              </span>
            </div>
            
            {posts.map((post, index) => (
              <div key={post.id} className="relative">
                <div className="absolute -left-4 xs:-left-6 sm:-left-8 top-3 sm:top-4 text-retro-brown font-bold text-sm sm:text-xl opacity-30">
                  {String(index + 1).padStart(2, '0')}
                </div>
                <PostCard post={post} />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 sm:mt-12 text-center retro-text opacity-50">
        <div className="inline-block border-2 border-retro-dark p-2 text-xs sm:text-base">
          ■ END OF DATA ■
        </div>
      </div>
    </div>
  );
}
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverApi } from '@/lib/api';
import { Post } from '@/types/api';
import { Metadata } from 'next';
import MarkdownRenderer from '@/components/MarkdownRenderer';

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
    <div className="mb-6 sm:mb-8">
      <Link 
        href="/"
        className="retro-button inline-block text-xs sm:text-base"
      >
        <span className="hidden xs:inline">&lt;&lt; BACK TO LIST</span>
        <span className="xs:hidden">&lt; BACK</span>
      </Link>
    </div>
  );
}

function PostHeader({ post }: { post: Post }) {
  const publishDate = post.publishdAt 
    ? `公開日: ${new Date(post.publishdAt).toLocaleDateString('ja-JP')}`
    : '下書き';

  return (
    <header className="retro-mobile-card retro-card mb-6 sm:mb-8 bg-gradient-to-br from-retro-cream to-retro-yellow">
      <div className="flex flex-col xs:flex-row xs:items-center justify-between mb-4 sm:mb-6 space-y-2 xs:space-y-0">
        <div className="text-retro-orange text-xs font-bold bg-retro-dark px-2 sm:px-3 py-1 inline-block">
          &gt; POST_ID: {post.id.substring(0, 8).toUpperCase()}
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-retro-green rounded-full animate-pulse"></div>
          <span className="retro-text text-xs sm:text-sm">LIVE</span>
        </div>
      </div>
      
      <h1 className="retro-title text-2xl xs:text-3xl sm:text-4xl lg:text-5xl mb-4 sm:mb-6 leading-tight break-words">
        📰 {post.title}
      </h1>
      
      <div className="retro-mobile-stack retro-text">
        <div className="bg-retro-dark text-retro-yellow px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold">
          {publishDate}
        </div>
        <div className="text-retro-brown text-xs sm:text-sm">
          {post.body.length} characters
        </div>
      </div>
    </header>
  );
}

function PostContent({ post }: { post: Post }) {
  return (
    <article className="retro-mobile-card retro-card mb-6 sm:mb-8">
      <div className="flex items-center mb-4 sm:mb-6">
        <div className="flex-1 h-0.5 sm:h-1 bg-retro-orange"></div>
        <div className="px-3 sm:px-4 retro-text font-bold text-sm sm:text-base">CONTENT</div>
        <div className="flex-1 h-0.5 sm:h-1 bg-retro-orange"></div>
      </div>
      
      <div className="retro-text leading-relaxed">
        <div className="bg-retro-dark bg-opacity-5 p-3 sm:p-6 border-l-2 sm:border-l-4 border-retro-orange mb-4 sm:mb-6">
          <MarkdownRenderer content={post.body} />
        </div>
      </div>
      
      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t-2 border-retro-orange border-dashed">
        <div className="flex items-center justify-center space-x-2 sm:space-x-4 retro-text text-xs sm:text-sm opacity-70">
          <span>■</span>
          <span>END OF POST</span>
          <span>■</span>
        </div>
      </div>
    </article>
  );
}

function PostActions() {
  return (
    <div className="retro-mobile-card retro-card bg-retro-dark text-retro-cream">
      <h3 className="retro-title text-lg sm:text-xl mb-3 sm:mb-4 text-retro-yellow">
        🎮 ACTIONS
      </h3>
      <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
        <Link 
          href="/"
          className="retro-button bg-retro-green border-retro-cream text-retro-dark flex-1 text-center text-xs sm:text-sm"
        >
          <span className="hidden xs:inline">📋 VIEW ALL POSTS</span>
          <span className="xs:hidden">📋 ALL POSTS</span>
        </Link>
        <a 
          href="#top"
          className="retro-button bg-retro-blue border-retro-cream text-retro-cream flex-1 text-center text-xs sm:text-sm"
        >
          <span className="hidden xs:inline">⬆️ SCROLL TO TOP</span>
          <span className="xs:hidden">⬆️ TOP</span>
        </a>
      </div>
    </div>
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
    throw error;
  }

  return (
    <div className="px-2 xs:px-4 sm:px-0">
      <BackLink />
      <PostHeader post={post} />
      <PostContent post={post} />
      <PostActions />
      
      <div className="mt-8 sm:mt-12 text-center">
        <div className="retro-text opacity-50">
          <div className="inline-block border-2 border-retro-dark p-2 text-xs sm:text-base">
            ◆ POST VIEWING COMPLETE ◆
          </div>
        </div>
      </div>
    </div>
  );
}
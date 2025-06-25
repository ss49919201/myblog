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
    <div className="mb-8">
      <Link 
        href="/"
        className="retro-button inline-block"
      >
        &lt;&lt; BACK TO LIST
      </Link>
    </div>
  );
}

function PostHeader({ post }: { post: Post }) {
  const publishDate = post.publishdAt 
    ? `公開日: ${new Date(post.publishdAt).toLocaleDateString('ja-JP')}`
    : '下書き';

  return (
    <header className="retro-card p-8 mb-8 bg-gradient-to-br from-retro-cream to-retro-yellow">
      <div className="flex items-center justify-between mb-6">
        <div className="text-retro-orange text-sm font-bold bg-retro-dark px-3 py-1">
          &gt; POST_ID: {post.id.substring(0, 12).toUpperCase()}
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-retro-green rounded-full animate-pulse"></div>
          <span className="retro-text text-sm">LIVE</span>
        </div>
      </div>
      
      <h1 className="retro-title text-4xl md:text-5xl mb-6 leading-tight">
        📰 {post.title}
      </h1>
      
      <div className="flex items-center space-x-4 retro-text">
        <div className="bg-retro-dark text-retro-yellow px-3 py-1 text-sm font-bold">
          {publishDate}
        </div>
        <div className="text-retro-brown text-sm">
          {post.body.length} characters
        </div>
      </div>
    </header>
  );
}

function PostContent({ post }: { post: Post }) {
  return (
    <article className="retro-card p-8 mb-8">
      <div className="flex items-center mb-6">
        <div className="flex-1 h-1 bg-retro-orange"></div>
        <div className="px-4 retro-text font-bold">CONTENT</div>
        <div className="flex-1 h-1 bg-retro-orange"></div>
      </div>
      
      <div className="retro-text leading-relaxed">
        <div className="bg-retro-dark bg-opacity-5 p-6 border-l-4 border-retro-orange mb-6">
          <pre className="whitespace-pre-wrap font-mono text-base leading-loose">
{post.body}
          </pre>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t-2 border-retro-orange border-dashed">
        <div className="flex items-center justify-center space-x-4 retro-text text-sm opacity-70">
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
    <div className="retro-card p-6 bg-retro-dark text-retro-cream">
      <h3 className="retro-title text-xl mb-4 text-retro-yellow">
        🎮 ACTIONS
      </h3>
      <div className="flex flex-wrap gap-4">
        <Link 
          href="/"
          className="retro-button bg-retro-green border-retro-cream text-retro-dark"
        >
          📋 VIEW ALL POSTS
        </Link>
        <a 
          href="#top"
          className="retro-button bg-retro-blue border-retro-cream text-retro-cream"
        >
          ⬆️ SCROLL TO TOP
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
    <div className="px-4 sm:px-0">
      <BackLink />
      <PostHeader post={post} />
      <PostContent post={post} />
      <PostActions />
      
      <div className="mt-12 text-center">
        <div className="retro-text opacity-50">
          <div className="inline-block border-2 border-retro-dark p-2">
            ◆ POST VIEWING COMPLETE ◆
          </div>
        </div>
      </div>
    </div>
  );
}
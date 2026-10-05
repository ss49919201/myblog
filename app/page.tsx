import { listPublishedPosts } from "@/lib/posts";
import { PostList } from "./_components/post-list";

export const dynamic = "force-dynamic";

export default async function Home() {
  return <PostList posts={await listPublishedPosts()} />;
}
